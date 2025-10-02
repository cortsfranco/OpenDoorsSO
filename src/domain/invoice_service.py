"""
Servicio de gestión de facturas y lógica de negocio.
"""

from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.invoice_repository import InvoiceRepository
from src.repositories.user_repository import UserRepository
from src.db.models.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceStatus, InvoiceType
from src.db.models.user import User


class InvoiceService:
    """
    Servicio para gestión de facturas.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.invoice_repo = InvoiceRepository(session, Invoice)
        self.user_repo = UserRepository(session, User)
    
    async def create_invoice(self, invoice_data: InvoiceCreate, user_id: int) -> Invoice:
        """
        Crea una nueva factura.
        
        Args:
            invoice_data: Datos de la factura
            user_id: ID del usuario que crea la factura
            
        Returns:
            Factura creada
            
        Raises:
            ValueError: Si el número de factura ya existe
        """
        # Verificar que el número de factura no exista en la empresa
        existing_invoice = await self.invoice_repo.get_by_invoice_number(
            invoice_data.invoice_number, 
            invoice_data.company_id
        )
        
        if existing_invoice:
            raise ValueError("El número de factura ya existe")
        
        # Calcular totales si no se proporcionan
        if invoice_data.subtotal is None or invoice_data.total_amount is None:
            invoice_data = self._calculate_totals(invoice_data)
        
        # Crear la factura
        return await self.invoice_repo.create(invoice_data)
    
    async def update_invoice_status(
        self, 
        invoice_id: int, 
        new_status: InvoiceStatus,
        user_id: int
    ) -> Optional[Invoice]:
        """
        Actualiza el estado de una factura.
        
        Args:
            invoice_id: ID de la factura
            new_status: Nuevo estado
            user_id: ID del usuario que realiza la actualización
            
        Returns:
            Factura actualizada o None si no existe
        """
        invoice = await self.invoice_repo.get(invoice_id)
        if not invoice:
            return None
        
        # Validar transiciones de estado permitidas
        if not self._is_valid_status_transition(invoice.status, new_status):
            raise ValueError(f"Transición de estado no permitida: {invoice.status} -> {new_status}")
        
        # Actualizar el estado
        update_data = InvoiceUpdate(status=new_status)
        return await self.invoice_repo.update(invoice_id, update_data)
    
    async def get_invoice_summary(self, company_id: int, year: int, month: int) -> dict:
        """
        Obtiene un resumen de facturas para un mes específico.
        
        Args:
            company_id: ID de la empresa
            year: Año
            month: Mes
            
        Returns:
            Diccionario con estadísticas del mes
        """
        # Calcular totales por estado
        total_approved = await self.invoice_repo.get_monthly_total(year, month, company_id)
        
        # Obtener facturas del mes
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        invoices = await self.invoice_repo.get_by_date_range(start_date, end_date, company_id)
        
        # Calcular estadísticas
        stats = {
            "total_invoices": len(invoices),
            "total_amount": sum(invoice.total_amount for invoice in invoices),
            "by_status": {},
            "by_type": {}
        }
        
        # Agrupar por estado
        for status in InvoiceStatus:
            status_invoices = [inv for inv in invoices if inv.status == status]
            stats["by_status"][status.value] = {
                "count": len(status_invoices),
                "amount": sum(inv.total_amount for inv in status_invoices)
            }
        
        # Agrupar por tipo
        for inv_type in InvoiceType:
            type_invoices = [inv for inv in invoices if inv.invoice_type == inv_type]
            stats["by_type"][inv_type.value] = {
                "count": len(type_invoices),
                "amount": sum(inv.total_amount for inv in type_invoices)
            }
        
        return stats
    
    async def get_overdue_invoices(self, company_id: int) -> List[Invoice]:
        """
        Obtiene facturas vencidas.
        
        Args:
            company_id: ID de la empresa
            
        Returns:
            Lista de facturas vencidas
        """
        return await self.invoice_repo.get_overdue_invoices(company_id)
    
    def _calculate_totals(self, invoice_data: InvoiceCreate) -> InvoiceCreate:
        """
        Calcula los totales de una factura basándose en sus items.
        
        Args:
            invoice_data: Datos de la factura
            
        Returns:
            Datos de la factura con totales calculados
        """
        # Por ahora, asumimos que los totales vienen calculados
        # En el futuro, esto se puede expandir para calcular desde los items
        return invoice_data
    
    def _is_valid_status_transition(self, current_status: InvoiceStatus, new_status: InvoiceStatus) -> bool:
        """
        Valida si una transición de estado es permitida.
        
        Args:
            current_status: Estado actual
            new_status: Nuevo estado
            
        Returns:
            True si la transición es válida, False en caso contrario
        """
        valid_transitions = {
            InvoiceStatus.DRAFT: [InvoiceStatus.PENDING, InvoiceStatus.CANCELLED],
            InvoiceStatus.PENDING: [InvoiceStatus.APPROVED, InvoiceStatus.CANCELLED],
            InvoiceStatus.APPROVED: [InvoiceStatus.SENT, InvoiceStatus.CANCELLED],
            InvoiceStatus.SENT: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
            InvoiceStatus.PAID: [],  # No se puede cambiar una factura pagada
            InvoiceStatus.CANCELLED: []  # No se puede cambiar una factura cancelada
        }
        
        return new_status in valid_transitions.get(current_status, [])
