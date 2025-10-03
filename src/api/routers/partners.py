from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.partner import Partner

router = APIRouter()

@router.get("/")
async def list_partners(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todos los socios"""
    query = select(Partner)
    result = await session.execute(query)
    partners = result.scalars().all()
    return {"partners": partners}

@router.get("/{partner_id}")
async def get_partner(
    partner_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtiene un socio por ID"""
    query = select(Partner).where(Partner.id == partner_id)
    result = await session.execute(query)
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    
    return {"partner": partner}

@router.post("/")
async def create_partner(
    partner_data: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Crea un nuevo socio"""
    partner = Partner(**partner_data)
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    return {"partner": partner, "message": "Socio creado"}

@router.put("/{partner_id}")
async def update_partner(
    partner_id: int,
    partner_data: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Actualiza un socio"""
    query = select(Partner).where(Partner.id == partner_id)
    result = await session.execute(query)
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    
    for key, value in partner_data.items():
        if hasattr(partner, key):
            setattr(partner, key, value)
    
    await session.commit()
    await session.refresh(partner)
    return {"partner": partner, "message": "Socio actualizado"}