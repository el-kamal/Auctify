import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import UploadFile
from app.models.auction import Auction, AuctionStatus
from app.models.actor import Actor, ActorType
from app.models.lot import Lot, LotStatus

class ImportService:
    @staticmethod
    async def create_auction_from_excel(db: AsyncSession, file: UploadFile, filename: str) -> tuple[Auction, list[dict]]:
        # 1. Create Auction
        auction = Auction(name=filename, status=AuctionStatus.MAPPED)
        db.add(auction)
        await db.flush()  # Get ID
        
        # 2. Parse Excel
        df = pd.read_excel(file.file)
        
        # Expected columns: Lot, Vendeur, Désignation
        # Normalize columns just in case
        df.columns = [c.strip() for c in df.columns]
        
        imported_items = []
        for _, row in df.iterrows():
            lot_number = row.get("Lot")
            seller_name = row.get("Vendeur")
            description = row.get("Désignation")
            
            if pd.isna(lot_number) or pd.isna(seller_name):
                continue
                
            # 3. Get or Create Seller
            result = await db.execute(select(Actor).where(Actor.name == seller_name, Actor.type == ActorType.SELLER))
            seller = result.scalars().first()
            
            if not seller:
                seller = Actor(name=seller_name, type=ActorType.SELLER)
                db.add(seller)
                await db.flush()
            
            # 4. Create Lot
            lot = Lot(
                auction_id=auction.id,
                lot_number=int(lot_number),
                description=description,
                seller_id=seller.id,
                status=LotStatus.CREATED
            )
            db.add(lot)
            
            imported_items.append({
                "lot_number": int(lot_number),
                "description": description,
                "seller_name": seller_name
            })
            
        await db.commit()
        await db.refresh(auction)
        return auction, imported_items

    @staticmethod
    async def import_mapping_for_auction(db: AsyncSession, auction_id: int, file: UploadFile) -> tuple[Auction, list[dict]]:
        # 1. Get Auction
        result = await db.execute(select(Auction).where(Auction.id == auction_id))
        auction = result.scalars().first()
        
        if not auction:
            raise ValueError(f"Auction with ID {auction_id} not found")
            
        # 2. Parse Excel
        df = pd.read_excel(file.file)
        
        # Expected columns: Lot, Vendeur, Désignation
        # Normalize columns just in case
        df.columns = [c.strip() for c in df.columns]
        
        imported_items = []
        for _, row in df.iterrows():
            lot_number = row.get("Lot")
            seller_name = row.get("Vendeur")
            description = row.get("Désignation")
            
            if pd.isna(lot_number) or pd.isna(seller_name):
                continue
                
            # 3. Get or Create Seller
            result = await db.execute(select(Actor).where(Actor.name == seller_name, Actor.type == ActorType.SELLER))
            seller = result.scalars().first()
            
            if not seller:
                seller = Actor(name=seller_name, type=ActorType.SELLER)
                db.add(seller)
                await db.flush()
            
            # 4. Check if Lot exists
            result = await db.execute(select(Lot).where(Lot.auction_id == auction.id, Lot.lot_number == int(lot_number)))
            existing_lot = result.scalars().first()
            
            if existing_lot:
                # Update existing lot
                existing_lot.description = description
                existing_lot.seller_id = seller.id
                # existing_lot.status = LotStatus.CREATED # Keep status or reset? Let's keep it.
            else:
                # Create Lot
                lot = Lot(
                    auction_id=auction.id,
                    lot_number=int(lot_number),
                    description=description,
                    seller_id=seller.id,
                    status=LotStatus.CREATED
                )
                db.add(lot)
            
            imported_items.append({
                "lot_number": int(lot_number),
                "description": description,
                "seller_name": seller_name
            })
            
        # Update Auction Status if needed
        if auction.status == AuctionStatus.CREATED:
            auction.status = AuctionStatus.MAPPED
            
        await db.commit()
        await db.refresh(auction)
        return auction, imported_items
