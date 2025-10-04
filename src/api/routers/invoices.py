<<<<<<< HEAD
"""
Router para operaciones relacionadas con facturas.
"""

from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
=======
from fastapi import APIRouter, Depends, HTTPException, Query
>>>>>>> refs/remotes/origin/master
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
    
<<<<<<< HEAD
    Args:
        page: Número de página
        limit: Número de elementos por página
        
    Returns:
        Lista paginada de facturas
    """
    try:
        # Calcular offset
        offset = (page - 1) * limit
        
        # Obtener facturas del usuario (excluyendo eliminadas)
        invoices_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.is_deleted == False
            )
        ).offset(offset).limit(limit).order_by(Invoice.created_at.desc())
        
        result = await session.execute(invoices_query)
        invoices = result.scalars().all()
        
        # Contar total de facturas (excluyendo eliminadas)
        count_query = select(func.count(Invoice.id)).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(count_query)
        total = result.scalar() or 0
        
        return {
            "invoices": [
                {
                    "id": invoice.id,
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "upload_date": invoice.upload_date,
                    "created_at": invoice.created_at,
                    "extracted_data": invoice.extracted_data,
                    "blob_url": invoice.blob_url,
                    "user_id": invoice.user_id,
                    "owner": invoice.owner
                }
                for invoice in invoices
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener facturas: {str(e)}"
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: dict,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Crea una nueva factura.
    """
    try:
        fecha_emision = invoice_data.get('fecha_emision')
        if fecha_emision and isinstance(fecha_emision, str):
            fecha_emision = datetime.strptime(fecha_emision, '%Y-%m-%d').date()
        
        fecha_vencimiento = invoice_data.get('fecha_vencimiento')
        if fecha_vencimiento and isinstance(fecha_vencimiento, str):
            fecha_vencimiento = datetime.strptime(fecha_vencimiento, '%Y-%m-%d').date()
        
        new_invoice = Invoice(
            user_id=current_user.id,
            filename=invoice_data.get('filename', 'manual.pdf'),
            status=invoice_data.get('status', 'completed'),
            tipo_factura=invoice_data.get('tipo_factura'),
            numero_factura=invoice_data.get('numero_factura'),
            cuit=invoice_data.get('cuit'),
            razon_social=invoice_data.get('razon_social'),
            fecha_emision=fecha_emision,
            fecha_vencimiento=fecha_vencimiento,
            subtotal=invoice_data.get('subtotal'),
            iva_porcentaje=invoice_data.get('iva_porcentaje'),
            iva_monto=invoice_data.get('iva_monto'),
            otros_impuestos=invoice_data.get('otros_impuestos'),
            total=invoice_data.get('total'),
            invoice_direction=invoice_data.get('invoice_direction', 'recibida'),
            owner=invoice_data.get('owner'),
            movimiento_cuenta=invoice_data.get('movimiento_cuenta', True),
            es_compensacion_iva=invoice_data.get('es_compensacion_iva', False),
            metodo_pago=invoice_data.get('metodo_pago', 'transferencia'),
            partner_id=invoice_data.get('partner_id')
        )
        
        session.add(new_invoice)
        await session.commit()
        await session.refresh(new_invoice)
        
        return new_invoice
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear factura: {str(e)}"
        )


@router.put("/{invoice_id}")
async def update_invoice(
    invoice_id: int,
    invoice_data: dict,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Actualiza una factura existente.
    """
    try:
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == current_user.id,
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        for key, value in invoice_data.items():
            if hasattr(invoice, key):
                setattr(invoice, key, value)
        
        await session.commit()
        await session.refresh(invoice)
        
        return invoice
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar factura: {str(e)}"
        )


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Elimina una factura (soft delete).
=======
    # Filtro de soft delete
    if not include_deleted:
        query = query.where(Invoice.is_deleted == False)
>>>>>>> refs/remotes/origin/master
    
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
<<<<<<< HEAD
    """
    Crea una factura manualmente sin archivo.
    """
    try:
        # Crear nueva factura
        new_invoice = Invoice(
            user_id=current_user.id,
            filename=f"manual_{invoice_data.get('invoice_number', 'unknown')}.json",
            status="completed",
            extracted_data=invoice_data,
            owner=invoice_data.get('owner'),
            blob_url=None
        )
        
        session.add(new_invoice)
        await session.commit()
        await session.refresh(new_invoice)
        
        return {
            "message": "Factura creada exitosamente",
            "invoice_id": new_invoice.id,
            "invoice": {
                "id": new_invoice.id,
                "filename": new_invoice.filename,
                "status": new_invoice.status,
                "owner": new_invoice.owner,
                "extracted_data": new_invoice.extracted_data,
                "created_at": new_invoice.created_at
            }
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear factura manual: {str(e)}"
        )


@router.post("/check-duplicate", summary="Verificar factura duplicada")
async def check_duplicate_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Verifica si una factura es duplicada comparando con facturas existentes.
    """
    try:
        # Leer contenido del archivo
        content = await file.read()
        
        # Aquí implementarías la lógica de detección de duplicados
        # Por ahora, simulamos la verificación
        
        # Ejemplo de lógica de duplicados:
        # 1. Extraer datos de la factura usando Document Intelligence
        # 2. Comparar número de factura, CUIT, fecha y monto total
        # 3. Devolver resultado
        
        # Simulación de verificación
        duplicate_check = {
            "is_duplicate": False,
            "confidence": 0.0,
            "similar_invoices": []
        }
        
        # En una implementación real, aquí harías:
        # - Procesar el archivo con Document Intelligence
        # - Buscar facturas similares en la base de datos
        # - Calcular nivel de similitud
        
        return duplicate_check
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar duplicados: {str(e)}"
        )
=======
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
>>>>>>> refs/remotes/origin/master
