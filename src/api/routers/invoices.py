from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import date, datetime

from src.core.database import get_session
from src.core.permissions import require_permission, Permission
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice, TipoFactura, MovimientoCuenta
from src.services.financial_calculator import FinancialCalculator

router = APIRouter()

@router.get("/")
async def list_invoices(
    skip: int = Query(0),
    limit: int = Query(100),
    tipo_factura: Optional[TipoFactura] = None,
    socio: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    include_deleted: bool = False,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista todas las facturas con filtros"""
    query = select(Invoice)
    
    # Filtro de soft delete
    if not include_deleted:
        query = query.where(Invoice.is_deleted == False)
    
    # Filtros opcionales
    if tipo_factura:
        query = query.where(Invoice.tipo_factura == tipo_factura)
    if socio:
        query = query.where(Invoice.socio_responsable == socio)
    if fecha_desde:
        query = query.where(Invoice.fecha_emision >= fecha_desde)
    if fecha_hasta:
        query = query.where(Invoice.fecha_emision <= fecha_hasta)
    
    # Paginación
    query = query.offset(skip).limit(limit)
    
    result = await session.execute(query)
    invoices = result.scalars().all()
    
    return {
        "invoices": invoices,
        "total": len(invoices),
        "skip": skip,
        "limit": limit
    }

@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtiene una factura por ID"""
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await session.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    # Validar coherencia de montos
    validacion = FinancialCalculator.validar_coherencia_montos(invoice)
    
    return {
        "invoice": invoice,
        "validacion_montos": validacion
    }

@router.post("/")
async def create_invoice(
    invoice_data: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Crea una nueva factura"""
    # Validar permisos
    from src.core.permissions import has_permission
    if not has_permission(current_user, Permission.INVOICE_CREATE):
        raise HTTPException(status_code=403, detail="Sin permisos para crear facturas")
    
    # Crear invoice
    invoice = Invoice(**invoice_data, user_id=current_user.id)
    
    # Validar coherencia de montos
    validacion = FinancialCalculator.validar_coherencia_montos(invoice)
    if not validacion["es_coherente"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Montos incoherentes: {validacion['mensaje']}"
        )
    
    session.add(invoice)
    await session.commit()
    await session.refresh(invoice)
    
    return {"invoice": invoice, "message": "Factura creada exitosamente"}

@router.put("/{invoice_id}")
async def update_invoice(
    invoice_id: int,
    invoice_data: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Actualiza una factura"""
    from src.core.permissions import has_permission
    if not has_permission(current_user, Permission.INVOICE_EDIT):
        raise HTTPException(status_code=403, detail="Sin permisos para editar")
    
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await session.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    # Actualizar campos
    for key, value in invoice_data.items():
        if hasattr(invoice, key):
            setattr(invoice, key, value)
    
    invoice.updated_at = datetime.utcnow()
    
    # Validar coherencia
    validacion = FinancialCalculator.validar_coherencia_montos(invoice)
    if not validacion["es_coherente"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Montos incoherentes: {validacion['mensaje']}"
        )
    
    await session.commit()
    await session.refresh(invoice)
    
    return {"invoice": invoice, "message": "Factura actualizada"}

@router.delete("/{invoice_id}")
async def soft_delete_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Soft delete de una factura"""
    from src.core.permissions import has_permission
    if not has_permission(current_user, Permission.INVOICE_DELETE):
        raise HTTPException(status_code=403, detail="Sin permisos para eliminar")
    
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await session.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    invoice.is_deleted = True
    invoice.deleted_at = datetime.utcnow()
    await session.commit()
    
    return {"message": "Factura eliminada (soft delete)"}

@router.post("/{invoice_id}/restore")
async def restore_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Restaura una factura eliminada"""
    from src.core.permissions import has_permission
    if not has_permission(current_user, Permission.INVOICE_RESTORE):
        raise HTTPException(status_code=403, detail="Sin permisos para restaurar")
    
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await session.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    invoice.is_deleted = False
    invoice.deleted_at = None
    await session.commit()
    
    return {"message": "Factura restaurada"}

@router.post("/{invoice_id}/approve")
async def approve_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Aprueba una factura"""
    from src.core.permissions import has_permission
    if not has_permission(current_user, Permission.INVOICE_APPROVE):
        raise HTTPException(status_code=403, detail="Sin permisos para aprobar")
    
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await session.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    invoice.payment_status = "approved"
    invoice.approver_id = current_user.id
    invoice.approved_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(invoice)
    
    return {"invoice": invoice, "message": "Factura aprobada"}