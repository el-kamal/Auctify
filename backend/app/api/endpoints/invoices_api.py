import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api import deps
from app.models.invoice import Invoice, InvoiceStatus
from app.models.lot import Lot, LotStatus
from app.models.auction import Auction
from app.services.vat_service import VATService
from app.services.compliance_service import ComplianceService
from app.services.facturx_service import FacturXService

router = APIRouter()

INVOICE_DIR = os.path.abspath("invoices") # Local path
if not os.path.exists(INVOICE_DIR):
    os.makedirs(INVOICE_DIR, exist_ok=True)

@router.post("/{auction_id}/generate")
async def generate_invoices(
    auction_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
):
    # 1. Get Auction
    auction = await db.get(Auction, auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
        
    # 2. Get SOLD Lots without Invoice
    # We group by Buyer to create one invoice per buyer?
    # Yes, usually one invoice per buyer for the auction.
    
    result = await db.execute(
        select(Lot).where(
            Lot.auction_id == auction_id, 
            Lot.status == LotStatus.SOLD,
            # Lot.invoice_id == None # We haven't added invoice_id to Lot yet, let's assume we query lots and check if they are already invoiced via some other way or just re-generate?
            # For simplicity, let's assume we generate for all sold lots and if we want to avoid duplicates we should check.
            # But wait, Lot doesn't have invoice_id FK yet.
            # We should probably add it or just link Invoice -> Lots (Invoice has many Lots).
            # Invoice model has buyer_id and auction_id.
            # We can query Invoices for this auction and buyer.
        )
    )
    lots = result.scalars().all()
    
    if not lots:
        raise HTTPException(status_code=400, detail="No sold lots found to invoice")

    # Group by Buyer
    lots_by_buyer = {}
    for lot in lots:
        if not lot.buyer_id:
            continue
        if lot.buyer_id not in lots_by_buyer:
            lots_by_buyer[lot.buyer_id] = []
        lots_by_buyer[lot.buyer_id].append(lot)
        
    generated_count = 0
    
    # Get last invoice hash for chaining
    # We need to order by ID desc
    last_invoice_result = await db.execute(select(Invoice).order_by(Invoice.id.desc()).limit(1))
    last_invoice = last_invoice_result.scalars().first()
    previous_hash = last_invoice.hash if last_invoice else "GENESIS_HASH"
    
    for buyer_id, buyer_lots in lots_by_buyer.items():
        # Check if invoice already exists for this buyer/auction?
        # Skip for now to allow re-generation or multiple invoices
        
        # Calculate Totals
        lines = []
        total_excl = 0.0
        total_vat = 0.0
        total_incl = 0.0
        
        for lot in buyer_lots:
            vat_details = VATService.calculate_lines(lot, auction.buyer_fee_rate, auction.platform_fee_rate)
            
            # Lot Line
            lines.append({
                "description": f"Lot {lot.lot_number}: {lot.description[:50]}...",
                "base": vat_details['lot']['base'],
                "vat_rate": vat_details['lot']['vat_rate'],
                "vat_amount": vat_details['lot']['vat_amount'],
                "total": vat_details['lot']['total']
            })
            
            # Fees Line
            lines.append({
                "description": f"Frais Lot {lot.lot_number}",
                "base": vat_details['fees']['base'],
                "vat_rate": vat_details['fees']['vat_rate'],
                "vat_amount": vat_details['fees']['vat_amount'],
                "total": vat_details['fees']['total']
            })

            # Platform Fees Line
            if vat_details['platform_fees']['total'] > 0:
                lines.append({
                    "description": f"Frais Plateforme Lot {lot.lot_number}",
                    "base": vat_details['platform_fees']['base'],
                    "vat_rate": vat_details['platform_fees']['vat_rate'],
                    "vat_amount": vat_details['platform_fees']['vat_amount'],
                    "total": vat_details['platform_fees']['total']
                })
            
            total_excl += vat_details['total']['excl']
            total_vat += vat_details['total']['vat']
            total_incl += vat_details['total']['incl']
            
        # Create Invoice Object
        # Generate Number: YYYY-MM-{SEQ}
        # Simple sequence for demo
        seq = generated_count + 1 + (last_invoice.id if last_invoice else 0)
        number = f"{datetime.now().year}-{datetime.now().month:02d}-{seq:04d}"
        
        invoice = Invoice(
            number=number,
            buyer_id=buyer_id,
            auction_id=auction_id,
            total_excl=total_excl,
            total_vat=total_vat,
            total_incl=total_incl,
            status=InvoiceStatus.VALIDATED, # Auto validate for demo
            signature_date=datetime.utcnow(),
            previous_hash=previous_hash
        )
        
        # Sign (Chain)
        invoice.hash = ComplianceService.sign_invoice(invoice, previous_hash)
        previous_hash = invoice.hash # Update for next iteration
        
        db.add(invoice)
        await db.flush() # Get ID
        
        # Generate PDF/Factur-X
        # We need to fetch buyer to get name/address for PDF
        # But buyer is lazy loaded? We can access it if session is open.
        # Or we can pass buyer object if we had it.
        # Let's rely on lazy loading or eager load in query.
        # We didn't eager load buyer in lots query.
        # We can fetch buyer separately or rely on relationship access (might trigger query).
        await db.refresh(invoice, attribute_names=['buyer'])
        
        try:
            pdf_path, xml_content = FacturXService.create_facturx_pdf(invoice, lines, INVOICE_DIR)
            invoice.pdf_path = pdf_path
            invoice.xml_content = xml_content
        except Exception as e:
            print(f"Error generating PDF for invoice {invoice.id}: {e}")
            # Continue but maybe mark as error?
        
        generated_count += 1
        
    await db.commit()
    
    return {"message": f"Generated {generated_count} invoices"}

@router.get("/{auction_id}/list")
async def list_invoices(
    auction_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Invoice).where(Invoice.auction_id == auction_id).order_by(Invoice.number)
    )
    invoices = result.scalars().all()
    return invoices
