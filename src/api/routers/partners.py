"""
Router para la gestión de socios/proveedores.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.partner import Partner

router = APIRouter()


class PartnerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    cuit: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    contact_person: Optional[str] = None
    business_type: Optional[str] = None
    tax_category: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    fiscal_data: Optional[dict] = None


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cuit: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    contact_person: Optional[str] = None
    business_type: Optional[str] = None
    tax_category: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    fiscal_data: Optional[dict] = None
    is_active: Optional[bool] = None


class PartnerResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    cuit: Optional[str]
    address: Optional[str]
    city: Optional[str]
    province: Optional[str]
    postal_code: Optional[str]
    contact_person: Optional[str]
    business_type: Optional[str]
    tax_category: Optional[str]
    payment_terms: Optional[str]
    notes: Optional[str]
    fiscal_data: Optional[dict]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PartnerResponse], summary="Obtener todos los socios")
async def get_partners(
    search: Optional[str] = Query(None, description="Buscar por nombre, email o CUIT"),
    business_type: Optional[str] = Query(None, description="Filtrar por tipo de negocio"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene todos los socios con filtros opcionales.
    """
    try:
        # TODO: Implementar con base de datos cuando la tabla esté lista
        # query = select(Partner)
        # 
        # # Aplicar filtros
        # filters = []
        # 
        # if search:
        #     filters.append(
        #         or_(
        #             Partner.name.ilike(f"%{search}%"),
        #             Partner.email.ilike(f"%{search}%"),
        #             Partner.cuit.ilike(f"%{search}%")
        #         )
        #     )
        # 
        # if business_type:
        #     filters.append(Partner.business_type == business_type)
        #     
        # if is_active is not None:
        #     filters.append(Partner.is_active == is_active)
        # 
        # if filters:
        #     query = query.where(and_(*filters))
        # 
        # query = query.order_by(Partner.name)
        # 
        # result = await session.execute(query)
        # partners = result.scalars().all()
        # 
        # return partners
        
        # Datos de ejemplo mientras se resuelve la tabla
        mock_partners = [
            PartnerResponse(
                id=1,
                name="Proveedor ABC S.A.",
                email="contacto@proveedorabc.com",
                phone="+54 11 1234-5678",
                cuit="20-12345678-9",
                address="Av. Corrientes 1234",
                city="Buenos Aires",
                province="CABA",
                postal_code="1043",
                contact_person="Juan Pérez",
                business_type="Servicios",
                tax_category="Responsable Inscripto",
                payment_terms="30 días",
                notes="Proveedor principal de servicios",
                fiscal_data={"monotributo": False, "responsable_inscripto": True},
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            PartnerResponse(
                id=2,
                name="Cliente XYZ Ltda.",
                email="facturacion@clientexyz.com",
                phone="+54 11 8765-4321",
                cuit="30-87654321-0",
                address="Av. Santa Fe 5678",
                city="Buenos Aires",
                province="CABA",
                postal_code="1060",
                contact_person="María González",
                business_type="Comercio",
                tax_category="Responsable Inscripto",
                payment_terms="15 días",
                notes="Cliente corporativo importante",
                fiscal_data={"monotributo": False, "responsable_inscripto": True},
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]
        
        return mock_partners
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener socios: {str(e)}"
        )


@router.get("/{partner_id}", response_model=PartnerResponse, summary="Obtener socio por ID")
async def get_partner(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene un socio específico por su ID.
    """
    try:
        result = await session.execute(
            select(Partner).where(Partner.id == partner_id)
        )
        partner = result.scalar_one_or_none()
        
        if not partner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Socio no encontrado"
            )
        
        return partner
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener socio: {str(e)}"
        )


@router.post("/", response_model=PartnerResponse, summary="Crear nuevo socio")
async def create_partner(
    partner_data: PartnerCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Crea un nuevo socio/proveedor.
    """
    try:
        # Verificar si ya existe un socio con el mismo nombre o CUIT
        existing_query = select(Partner).where(
            or_(
                Partner.name == partner_data.name,
                Partner.cuit == partner_data.cuit
            )
        )
        result = await session.execute(existing_query)
        existing_partner = result.scalar_one_or_none()
        
        if existing_partner:
            if existing_partner.name == partner_data.name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un socio con este nombre"
                )
            if existing_partner.cuit == partner_data.cuit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un socio con este CUIT"
                )
        
        # Crear nuevo socio
        new_partner = Partner(**partner_data.dict())
        session.add(new_partner)
        await session.commit()
        await session.refresh(new_partner)
        
        return new_partner
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear socio: {str(e)}"
        )


@router.put("/{partner_id}", response_model=PartnerResponse, summary="Actualizar socio")
async def update_partner(
    partner_id: int,
    partner_data: PartnerUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Actualiza un socio existente.
    """
    try:
        # Obtener socio existente
        result = await session.execute(
            select(Partner).where(Partner.id == partner_id)
        )
        partner = result.scalar_one_or_none()
        
        if not partner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Socio no encontrado"
            )
        
        # Verificar duplicados si se está actualizando nombre o CUIT
        if partner_data.name or partner_data.cuit:
            existing_query = select(Partner).where(
                and_(
                    Partner.id != partner_id,
                    or_(
                        Partner.name == partner_data.name,
                        Partner.cuit == partner_data.cuit
                    )
                )
            )
            result = await session.execute(existing_query)
            existing_partner = result.scalar_one_or_none()
            
            if existing_partner:
                if existing_partner.name == partner_data.name:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ya existe un socio con este nombre"
                    )
                if existing_partner.cuit == partner_data.cuit:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ya existe un socio con este CUIT"
                    )
        
        # Actualizar campos
        update_data = partner_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(partner, field, value)
        
        partner.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(partner)
        
        return partner
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar socio: {str(e)}"
        )


@router.delete("/{partner_id}", summary="Eliminar socio (soft delete)")
async def delete_partner(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Elimina un socio (soft delete).
    """
    try:
        result = await session.execute(
            select(Partner).where(Partner.id == partner_id)
        )
        partner = result.scalar_one_or_none()
        
        if not partner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Socio no encontrado"
            )
        
        partner.is_active = False
        partner.updated_at = datetime.utcnow()
        
        await session.commit()
        
        return {"message": "Socio eliminado exitosamente", "partner_id": partner_id}
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar socio: {str(e)}"
        )
