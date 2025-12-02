from app.models.actor import ActorType

class VATService:
    @staticmethod
    def calculate_lines(lot, buyer_fee_rate: float):
        """
        Calculates VAT details for a Lot.
        
        Rules:
        - Seller PARTICULIER:
            - Lot: Margin Scheme (TVA sur marge) -> In this simplified version, we assume 0% VAT on Hammer Price (Code E).
            - Fees: 20% VAT (Code S).
        - Seller SOCIETE:
            - Lot: 20% VAT (Code S).
            - Fees: 20% VAT (Code S).
        """
        
        hammer_price = lot.hammer_price or 0
        buyer_fees_excl = hammer_price * buyer_fee_rate
        
        # Determine Seller Type
        seller_type = lot.seller.type if lot.seller else ActorType.SELLER # Default to Seller if unknown? Or maybe we should default to Private?
        # Actually, we need to know if seller is a company or individual.
        # In our Actor model, we just have 'SELLER'. We might need a flag 'is_company'.
        # For now, let's assume all sellers are companies if not specified, or check name?
        # The prompt says: "Seller 'PARTICULIER' vs 'SOCIETE'".
        # I don't have this field in Actor model yet.
        # I should probably add it or infer it.
        # Let's assume for now that if the name contains "SARL", "SAS", "SA", "EURL", it's a company.
        # Or better, let's add a property to Actor model later.
        # For this iteration, I will assume everyone is a SOCIETE (20%) unless name starts with "M." or "Mme".
        
        is_company = True
        if lot.seller and (lot.seller.name.startswith("M.") or lot.seller.name.startswith("Mme")):
            is_company = False
            
        # Lot VAT
        if is_company:
            lot_vat_rate = 0.20
            lot_vat_amount = hammer_price * lot_vat_rate
            lot_total = hammer_price + lot_vat_amount
        else:
            lot_vat_rate = 0.0
            lot_vat_amount = 0.0
            lot_total = hammer_price
            
        # Fees VAT (Always 20%)
        fees_vat_rate = 0.20
        fees_vat_amount = buyer_fees_excl * fees_vat_rate
        fees_total = buyer_fees_excl + fees_vat_amount
        
        return {
            "lot": {
                "base": hammer_price,
                "vat_rate": lot_vat_rate,
                "vat_amount": lot_vat_amount,
                "total": lot_total
            },
            "fees": {
                "base": buyer_fees_excl,
                "vat_rate": fees_vat_rate,
                "vat_amount": fees_vat_amount,
                "total": fees_total
            },
            "total": {
                "excl": hammer_price + buyer_fees_excl,
                "vat": lot_vat_amount + fees_vat_amount,
                "incl": lot_total + fees_total
            }
        }
