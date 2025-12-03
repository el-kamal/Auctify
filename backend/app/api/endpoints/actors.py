from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.actor import Actor, ActorType
from app.models.user import User, UserRole
from app.schemas.actor import Actor as ActorSchema, ActorCreate, ActorUpdate

router = APIRouter()

@router.get("/", response_model=List[ActorSchema])
async def read_actors(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    type: ActorType = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve actors.
    """
    query = select(Actor).offset(skip).limit(limit)
    if type:
        query = query.filter(Actor.type == type)
    
    result = await db.execute(query)
    actors = result.scalars().all()
    return actors

@router.post("/", response_model=ActorSchema)
async def create_actor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    actor_in: ActorCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new actor.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.CLERK]:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    result = await db.execute(select(Actor).filter(Actor.name == actor_in.name))
    actor = result.scalars().first()
    if actor:
        raise HTTPException(
            status_code=400,
            detail="The actor with this name already exists in the system.",
        )
    
    actor = Actor(
        name=actor_in.name,
        type=actor_in.type,
        email=actor_in.email,
        address=actor_in.address,
        iban=actor_in.iban,
        bic=actor_in.bic,
        vat_subject=actor_in.vat_subject
    )
    db.add(actor)
    await db.commit()
    await db.refresh(actor)
    return actor

@router.put("/{id}", response_model=ActorSchema)
async def update_actor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    actor_in: ActorUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an actor.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.CLERK]:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    result = await db.execute(select(Actor).where(Actor.id == id))
    actor = result.scalars().first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    update_data = actor_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(actor, field, value)
    
    db.add(actor)
    await db.commit()
    await db.refresh(actor)
    return actor

@router.delete("/{id}", response_model=ActorSchema)
async def delete_actor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an actor.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.CLERK]:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    result = await db.execute(select(Actor).where(Actor.id == id))
    actor = result.scalars().first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    await db.delete(actor)
    await db.commit()
    return actor
