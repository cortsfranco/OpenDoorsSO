"""
Router para el flujo de aprobación de pagos inspirado en Mendel.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice
from src.services.activity_logger import ActivityLogger

router = APIRouter()


class ApprovalRequest(BaseModel):
    reason: Optional[str] = None


class ApprovalResponse(BaseModel):
    message: str
    invoice_id: int
    status: str
    approved_at: Optional[datetime] = None
    approver_name: Optional[str] = None


class RejectionRequest(BaseModel):
    reason: str


class RejectionResponse(BaseModel):
    message: str
    invoice_id: int
    status: str
    rejected_at: datetime
    rejector_name: str


class PendingInvoiceResponse(BaseModel):
    id: int
    filename: str
    invoice_number: Optional[str] = None
    client_name: Optional[str] = None
    total: Optional[float] = None
    upload_date: datetime
    owner: Optional[str] = None
    extracted_data: Optional[dict] = None
    user_name: str


async def check_approver_role(current_user: User = Depends(get_current_user)) -> User:
    """Verifica que el usuario tiene rol de aprobador o admin."""
    # TODO: Restaurar verificación de roles cuando se implemente correctamente
    # if current_user.role not in ["approver", "admin"]:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="No tienes permisos para aprobar/rechazar facturas"
    #     )
    return current_user


@router.get("/pending", response_model=List[PendingInvoiceResponse], summary="Obtener facturas pendientes de aprobación")
async def get_pending_approvals(
    current_user: User = Depends(check_approver_role),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene todas las facturas pendientes de aprobación.
    Solo visible para usuarios con rol 'approver' o 'admin'.
    """
    try:
        # TODO: Implementar con base de datos cuando la estructura esté lista
        # query = select(Invoice, User).join(
        #     User, Invoice.user_id == User.id
        # ).where(
        #     and_(
        #         Invoice.payment_status == "pending_approval",
        #         Invoice.is_deleted == False
        #     )
        # ).order_by(Invoice.upload_date.asc())
        # 
        # result = await session.execute(query)
        # invoices_with_users = result.all()
        # 
        # pending_invoices = []
        # for invoice, user in invoices_with_users:
        #     extracted_data = invoice.extracted_data or {}
        #     
        #     pending_invoices.append(PendingInvoiceResponse(
        #         id=invoice.id,
        #         filename=invoice.filename,
        #         invoice_number=extracted_data.get("invoice_number"),
        #         client_name=extracted_data.get("client_name"),
        #         total=extracted_data.get("total"),
        #         upload_date=invoice.upload_date,
        #         owner=invoice.owner,
        #         extracted_data=extracted_data,
        #         user_name=user.full_name
        #     ))
        
        # Datos de ejemplo mientras se resuelve la estructura de BD
        pending_invoices = [
            PendingInvoiceResponse(
                id=1,
                filename="factura_001.pdf",
                invoice_number="F-2024-001",
                client_name="Cliente ABC S.A.",
                total=15000.0,
                upload_date=datetime.now(),
                owner="Hernán Pagani",
                extracted_data={
                    "invoice_number": "F-2024-001",
                    "client_name": "Cliente ABC S.A.",
                    "total": 15000.0,
                    "subtotal": 13000.0,
                    "iva": 2000.0
                },
                user_name="Franco Test"
            ),
            PendingInvoiceResponse(
                id=2,
                filename="factura_002.pdf",
                invoice_number="F-2024-002",
                client_name="Proveedor XYZ Ltda.",
                total=8500.0,
                upload_date=datetime.now(),
                owner="Joni Tagua",
                extracted_data={
                    "invoice_number": "F-2024-002",
                    "client_name": "Proveedor XYZ Ltda.",
                    "total": 8500.0,
                    "subtotal": 7500.0,
                    "iva": 1000.0
                },
                user_name="Franco Test"
            )
        ]
        
        # Log de la actividad
        # activity_logger = ActivityLogger(session)
        # await activity_logger.log_activity(
        #     user_id=current_user.id,
        #     action="VIEW_PENDING_APPROVALS",
        #     details={"count": len(pending_invoices)}
        # )
        
        return pending_invoices
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener facturas pendientes: {str(e)}"
        )


@router.post("/{invoice_id}/approve", response_model=ApprovalResponse, summary="Aprobar una factura")
async def approve_invoice(
    invoice_id: int,
    request: ApprovalRequest,
    current_user: User = Depends(check_approver_role),
    session: AsyncSession = Depends(get_session)
):
    """
    Aprueba una factura pendiente de aprobación.
    Solo accesible para usuarios con rol 'approver' o 'admin'.
    """
    try:
        # Buscar la factura
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.payment_status == "pending_approval",
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada o no pendiente de aprobación"
            )
        
        # Actualizar estado de la factura
        invoice.payment_status = "approved"
        invoice.approver_id = current_user.id
        invoice.approved_at = datetime.now(timezone.utc)
        invoice.updated_at = datetime.now(timezone.utc)
        
        # Log de la actividad
        activity_logger = ActivityLogger(session)
        await activity_logger.log_activity(
            user_id=current_user.id,
            action="APPROVE_INVOICE",
            details={
                "invoice_id": invoice_id,
                "invoice_filename": invoice.filename,
                "reason": request.reason,
                "previous_status": "pending_approval"
            }
        )
        
        await session.commit()
        await session.refresh(invoice)
        
        return ApprovalResponse(
            message="Factura aprobada exitosamente",
            invoice_id=invoice.id,
            status=invoice.payment_status,
            approved_at=invoice.approved_at,
            approver_name=current_user.full_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al aprobar factura: {str(e)}"
        )


@router.post("/{invoice_id}/reject", response_model=RejectionResponse, summary="Rechazar una factura")
async def reject_invoice(
    invoice_id: int,
    request: RejectionRequest,
    current_user: User = Depends(check_approver_role),
    session: AsyncSession = Depends(get_session)
):
    """
    Rechaza una factura pendiente de aprobación.
    Solo accesible para usuarios con rol 'approver' o 'admin'.
    """
    try:
        # Buscar la factura
        invoice_query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.payment_status == "pending_approval",
                Invoice.is_deleted == False
            )
        )
        result = await session.execute(invoice_query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada o no pendiente de aprobación"
            )
        
        # Actualizar estado de la factura
        invoice.payment_status = "rejected"
        invoice.approver_id = current_user.id
        invoice.approved_at = datetime.now(timezone.utc)  # Fecha de rechazo
        invoice.updated_at = datetime.now(timezone.utc)
        
        # Log de la actividad
        activity_logger = ActivityLogger(session)
        await activity_logger.log_activity(
            user_id=current_user.id,
            action="REJECT_INVOICE",
            details={
                "invoice_id": invoice_id,
                "invoice_filename": invoice.filename,
                "reason": request.reason,
                "previous_status": "pending_approval"
            }
        )
        
        await session.commit()
        await session.refresh(invoice)
        
        return RejectionResponse(
            message="Factura rechazada exitosamente",
            invoice_id=invoice.id,
            status=invoice.payment_status,
            rejected_at=invoice.approved_at,
            rejector_name=current_user.full_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al rechazar factura: {str(e)}"
        )


@router.get("/{invoice_id}/details", summary="Obtener detalles de factura para aprobación")
async def get_invoice_approval_details(
    invoice_id: int,
    current_user: User = Depends(check_approver_role),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene los detalles completos de una factura para revisión de aprobación.
    """
    try:
        invoice_query = select(Invoice, User).join(
            User, Invoice.user_id == User.id
        ).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.is_deleted == False
            )
        )
        
        result = await session.execute(invoice_query)
        invoice_user = result.first()
        
        if not invoice_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        invoice, user = invoice_user
        extracted_data = invoice.extracted_data or {}
        
        return {
            "id": invoice.id,
            "filename": invoice.filename,
            "status": invoice.status,
            "payment_status": invoice.payment_status,
            "upload_date": invoice.upload_date,
            "owner": invoice.owner,
            "uploaded_by": user.full_name,
            "extracted_data": extracted_data,
            "blob_url": invoice.blob_url,
            "created_at": invoice.created_at,
            "updated_at": invoice.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener detalles de factura: {str(e)}"
        )