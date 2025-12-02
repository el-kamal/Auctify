import hashlib
from datetime import datetime

class ComplianceService:
    @staticmethod
    def sign_invoice(invoice, previous_hash: str = None) -> str:
        """
        Generates a SHA256 hash for the invoice, chaining it with the previous invoice's hash.
        """
        # Data to sign
        data = f"{invoice.number}|{invoice.buyer_id}|{invoice.total_incl}|{invoice.signature_date}|{previous_hash}"
        
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
