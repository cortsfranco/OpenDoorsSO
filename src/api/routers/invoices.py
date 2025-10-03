"""
Router para operaciones relacionadas con facturas.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice

router = APIRouter()


@router.get("/summary")
async def get_invoices_summary(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene un resumen de las métricas financieras del usuario.
    
    Returns:
        Resumen con total facturado, IVA a favor y facturas pendientes
    """
    try:
        # Obtener facturas completadas del usuario (excluyendo eliminadas)
        completed_invoices_query = select(Invoice).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status == "completed",
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(completed_invoices_query)
        completed_invoices = result.scalars().all()
        
        # Calcular métricas
        total_facturado = 0
        iva_a_favor = 0
        
        for invoice in completed_invoices:
            if invoice.extracted_data:
                # Extraer datos de la factura
                total = invoice.extracted_data.get("total", 0)
                iva = invoice.extracted_data.get("iva", 0)
                
                if isinstance(total, (int, float)):
                    total_facturado += total
                if isinstance(iva, (int, float)):
                    iva_a_favor += iva
        
        # Contar facturas pendientes (excluyendo eliminadas)
        pending_invoices_query = select(func.count(Invoice.id)).where(
            and_(
                Invoice.user_id == current_user.id,
                Invoice.status.in_(["pending", "processing"]),
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(pending_invoices_query)
        facturas_pendientes = result.scalar() or 0
        
        return {
            "total_facturado": total_facturado,
            "iva_a_favor": iva_a_favor,
            "facturas_pendientes": facturas_pendientes,
            "total_facturado_change": 0,  # TODO: Implementar cálculo de cambio
            "iva_a_favor_change": 0,      # TODO: Implementar cálculo de cambio
            "facturas_pendientes_change": 0  # TODO: Implementar cálculo de cambio
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener resumen de facturas: {str(e)}"
        )


@router.get("/")
async def get_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene la lista de facturas del usuario con paginación.
    
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


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Elimina una factura (soft delete).
    
    Args:
        invoice_id: ID de la factura a eliminar
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Mensaje de confirmación
    """
    try:
        # Verificar que la factura existe y pertenece al usuario
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
        
        # Soft delete
        invoice.is_deleted = True
        invoice.deleted_at = func.now()
        invoice.updated_at = func.now()
        
        await session.commit()
        
        return {
            "message": "Factura eliminada exitosamente",
            "invoice_id": invoice_id,
            "deleted_at": invoice.deleted_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar factura: {str(e)}"
        )


@router.post("/{invoice_id}/restore")
async def restore_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Restaura una factura desde la papelera.
    
    Args:
        invoice_id: ID de la factura a restaurar
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Mensaje de confirmación
    """
    try:
        # Verificar que la factura existe y está eliminada
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == current_user.id,
                Invoice.is_deleted == True
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada en la papelera"
            )
        
        # Restaurar
        invoice.is_deleted = False
        invoice.deleted_at = None
        invoice.updated_at = func.now()
        
        await session.commit()
        
        return {
            "message": "Factura restaurada exitosamente",
            "invoice_id": invoice_id,
            "restored_at": invoice.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al restaurar factura: {str(e)}"
        )


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene los detalles de una factura específica.
    
    Args:
        invoice_id: ID de la factura
        
    Returns:
        Detalles de la factura
    """
    try:
        # Obtener la factura
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == current_user.id
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        return {
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener factura: {str(e)}"
        )


@router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: int,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Actualiza campos específicos de una factura (autoguardado).
    
    Args:
        invoice_id: ID de la factura
        update_data: Diccionario con los campos a actualizar
        
    Returns:
        Factura actualizada
    """
    try:
        # Obtener la factura
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == current_user.id
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        # Campos permitidos para actualización
        allowed_fields = ['extracted_data', 'owner', 'status']
        
        # Actualizar solo los campos permitidos
        for field, value in update_data.items():
            if field in allowed_fields and hasattr(invoice, field):
                setattr(invoice, field, value)
        
        # Marcar como actualizado
        invoice.updated_at = func.now()
        
        await session.commit()
        await session.refresh(invoice)
        
        return {
            "id": invoice.id,
            "filename": invoice.filename,
            "status": invoice.status,
            "upload_date": invoice.upload_date,
            "created_at": invoice.created_at,
            "extracted_data": invoice.extracted_data,
            "blob_url": invoice.blob_url,
            "user_id": invoice.user_id,
            "owner": invoice.owner,
            "updated_at": invoice.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar factura: {str(e)}"
        )


@router.get("/trash", summary="Obtiene facturas eliminadas (papelera)")
async def get_deleted_invoices(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene todas las facturas eliminadas (en la papelera) del usuario.
    """
    try:
        result = await session.execute(
            select(Invoice).where(
                and_(
                    Invoice.user_id == current_user.id,
                    Invoice.is_deleted == True
                )
            ).order_by(Invoice.deleted_at.desc())
        )
        invoices = result.scalars().all()
        
        return {
            "invoices": [
                {
                    "id": invoice.id,
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "upload_date": invoice.upload_date,
                    "created_at": invoice.created_at,
                    "deleted_at": invoice.deleted_at,
                    "extracted_data": invoice.extracted_data,
                    "blob_url": invoice.blob_url,
                    "user_id": invoice.user_id,
                    "owner": invoice.owner
                }
                for invoice in invoices
            ],
            "total": len(invoices)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener facturas eliminadas: {str(e)}"
        )


@router.post("/manual", summary="Crear factura manualmente")
async def create_manual_invoice(
    invoice_data: dict,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
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


@router.patch("/bulk-update")
async def bulk_update_invoices(
    updates: List[dict],
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Actualiza múltiples facturas en lote.
    
    Args:
        updates: Lista de diccionarios con {id, field, value}
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Resultado de la actualización
    """
    try:
        updated_count = 0
        
        for update in updates:
            invoice_id = update.get('id')
            field = update.get('field')
            value = update.get('value')
            
            if not all([invoice_id, field, value is not None]):
                continue
                
            # Obtener la factura
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
                continue
                
            # Actualizar el campo específico
            if field.startswith('extracted_data.'):
                # Campo dentro de extracted_data
                subfield = field.replace('extracted_data.', '')
                if not invoice.extracted_data:
                    invoice.extracted_data = {}
                invoice.extracted_data[subfield] = value
            else:
                # Campo directo del modelo
                setattr(invoice, field, value)
            
            updated_count += 1
        
        await session.commit()
        
        return {
            "message": f"Se actualizaron {updated_count} facturas correctamente",
            "updated_count": updated_count
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar facturas en lote: {str(e)}"
        )


@router.delete("/bulk-delete")
async def bulk_delete_invoices(
    invoice_ids: List[int],
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Elimina múltiples facturas en lote (soft delete).
    
    Args:
        invoice_ids: Lista de IDs de facturas a eliminar
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Resultado de la eliminación
    """
    try:
        deleted_count = 0
        
        for invoice_id in invoice_ids:
            # Obtener la factura
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
                continue
                
            # Soft delete
            invoice.is_deleted = True
            deleted_count += 1
        
        await session.commit()
        
        return {
            "message": f"Se eliminaron {deleted_count} facturas correctamente",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar facturas en lote: {str(e)}"
        )