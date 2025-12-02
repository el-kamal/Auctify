import pandas as pd
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from app.models.auction import Auction
from app.models.actor import Actor, ActorType
from app.models.lot import Lot, LotStatus

class ReconciliationService:
    @staticmethod
    async def reconcile_auction(db: AsyncSession, auction_id: int, file: UploadFile):
        # 1. Load DB Lots
        result = await db.execute(select(Lot).where(Lot.auction_id == auction_id))
        db_lots = {lot.lot_number: lot for lot in result.scalars().all()}
        
        # 2. Parse CSV
        # Handle encoding and separator issues similar to analysis script
        content = await file.read()
        try:
            df = pd.read_csv(pd.io.common.BytesIO(content), encoding='utf-8')
        except:
            try:
                df = pd.read_csv(pd.io.common.BytesIO(content), encoding='latin-1', sep=';')
            except:
                df = pd.read_csv(pd.io.common.BytesIO(content), encoding='cp1252', sep=';')
        
        if len(df.columns) <= 1:
             try:
                df = pd.read_csv(pd.io.common.BytesIO(content), encoding='latin-1', sep=';')
             except:
                pass

        # Normalize columns
        df.columns = [c.strip() for c in df.columns]
        
        processed_lot_numbers = set()
        
        for _, row in df.iterrows():
            lot_number = row.get("Lot")
            if pd.isna(lot_number):
                continue
            lot_number = int(lot_number)
            processed_lot_numbers.add(lot_number)
            
            price = row.get("Adj.")
            buyer_code = row.get("Numéro acheteur")
            buyer_name = row.get("Nom")
            buyer_firstname = row.get("Prénom")
            buyer_email = row.get("Email")
            buyer_address = row.get("Adresse")
            
            # 3. Get or Create Buyer
            buyer = None
            if buyer_code:
                # Try to find by name first if code is not unique or just use name as key?
                # Let's use name + firstname as unique key for now or just name if unique constraint
                # The Actor model has unique name. Let's construct a unique name.
                full_name = f"{buyer_name} {buyer_firstname}".strip()
                if not full_name:
                    full_name = str(buyer_code)
                
                result = await db.execute(select(Actor).where(Actor.name == full_name, Actor.type == ActorType.BUYER))
                buyer = result.scalars().first()
                
                if not buyer:
                    buyer = Actor(
                        name=full_name, 
                        type=ActorType.BUYER,
                        email=buyer_email if pd.notna(buyer_email) else None,
                        address=buyer_address if pd.notna(buyer_address) else None
                    )
                    db.add(buyer)
                    await db.flush()
            
            # 4. Match Logic
            if lot_number in db_lots:
                # MATCH
                lot = db_lots[lot_number]
                lot.status = LotStatus.SOLD
                lot.hammer_price = int(price) if pd.notna(price) else 0
                if buyer:
                    lot.buyer_id = buyer.id
            else:
                # ANOMALIE (Lot in CSV but not in DB)
                # We need to create it, but it has no seller from mapping.
                # Seller ID is nullable now? No, I made it nullable in model but let's check.
                # I updated model to nullable=True for seller_id.
                lot = Lot(
                    auction_id=auction_id,
                    lot_number=lot_number,
                    description=row.get("Description"),
                    hammer_price=int(price) if pd.notna(price) else 0,
                    buyer_id=buyer.id if buyer else None,
                    seller_id=None, # No seller known
                    status=LotStatus.ANOMALIE
                )
                db.add(lot)
        
        # 5. Handle Unsold (In DB but not in CSV)
        for lot_num, lot in db_lots.items():
            if lot_num not in processed_lot_numbers:
                lot.status = LotStatus.UNSOLD
        
        await db.commit()
        
        # Return stats
        return {
            "processed": len(df),
            "matched": len(processed_lot_numbers.intersection(db_lots.keys())),
            "anomalies": len(processed_lot_numbers - db_lots.keys()),
            "unsold": len(set(db_lots.keys()) - processed_lot_numbers)
        }

    @staticmethod
    async def get_results(db: AsyncSession, auction_id: int, status: str = None, seller_name: str = None):
        query = select(Lot).options(joinedload(Lot.seller), joinedload(Lot.buyer)).where(Lot.auction_id == auction_id)
        
        if status:
            if status == "SOLD":
                query = query.where(Lot.status == LotStatus.SOLD)
            elif status == "UNSOLD":
                query = query.where(Lot.status == LotStatus.UNSOLD)
            elif status == "ANOMALIE":
                query = query.where(Lot.status == LotStatus.ANOMALIE)
                
        # For seller filtering, we need to join with Actor (seller)
        # But Lot.seller is a relationship.
        if seller_name:
            query = query.join(Lot.seller).where(Actor.name.ilike(f"%{seller_name}%"))
            
        result = await db.execute(query.order_by(Lot.lot_number))
        lots = result.scalars().all()
        
        results = []
        for lot in lots:
            results.append({
                "lot_number": lot.lot_number,
                "description": lot.description,
                "seller_name": lot.seller.name if lot.seller else "Inconnu",
                "status": lot.status,
                "hammer_price": lot.hammer_price,
                "buyer_name": lot.buyer.name if lot.buyer else None
            })
            
        return results

    @staticmethod
    async def export_results(db: AsyncSession, auction_id: int, status: str = None, seller_name: str = None):
        # 1. Fetch Data
        # We can reuse get_results logic but we need the Auction info too
        auction_result = await db.execute(select(Auction).where(Auction.id == auction_id))
        auction = auction_result.scalars().first()
        
        results = await ReconciliationService.get_results(db, auction_id, status, seller_name)
        
        # 2. Create DataFrame
        data = []
        for item in results:
            data.append({
                "Vente": auction.name if auction else f"Vente #{auction_id}",
                "N° Lot": item["lot_number"],
                "Description": item["description"],
                "Vendeur": item["seller_name"],
                "Statut": "Vendu" if item["status"] == "SOLD" else "Invendu" if item["status"] == "UNSOLD" else item["status"],
                "Adjudication": item["hammer_price"],
                "Acheteur": item["buyer_name"]
            })
            
        df = pd.DataFrame(data)
        
        # 3. Export to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Résultats')
            # Auto-adjust columns width (simplified for openpyxl if needed, or skip)
            # Openpyxl auto-width is a bit more manual, skipping for now to keep it simple
                
        output.seek(0)
        return output
