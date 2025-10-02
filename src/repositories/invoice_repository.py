"""
Repositorio específico para facturas.
"""

from typing import Optional, List
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from src.repositories.base import SQLAlchemyRepository
from src.db.models.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceStatus


class InvoiceRepository(SQLAlchemyRepository[Invoice, InvoiceCreate, InvoiceUpdate]):
    """
    Repositorio para gestionar facturas.
    """
    
    async def get_by_invoice_number(self, invoice_number: str, company_id: int) -> Optional[Invoice]:
        """
        Obtiene una factura por su número y empresa.
        
        Args:
            invoice_number: Número de factura
            company_id: ID de la empresa
            
        Returns:
            Factura encontrada o None
        """
        result = await self.session.execute(
            select(Invoice).where(
                and_(
                    Invoice.invoice_number == invoice_number,
                    Invoice.company_id == company_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_client(self, client_id: int, company_id: int) -> List[Invoice]:
        """
        Obtiene todas las facturas de un cliente.
        
        Args:
            client_id: ID del cliente
            company_id: ID de la empresa
            
        Returns:
            Lista de facturas del cliente
        """
        result = await self.session.execute(
            select(Invoice).where(
                and_(
                    Invoice.client_id == client_id,
                    Invoice.company_id == company_id
                )
            )
        )
        return result.scalars().all()
    
    async def get_by_status(self, status: InvoiceStatus, company_id: int) -> List[Invoice]:
        """
        Obtiene todas las facturas con un estado específico.
        
        Args:
            status: Estado de la factura
            company_id: ID de la empresa
            
        Returns:
            Lista de facturas con el estado especificado
        """
        result = await self.session.execute(
            select(Invoice).where(
                and_(
                    Invoice.status == status,
                    Invoice.company_id == company_id
                )
            )
        )
        return result.scalars().all()
    
    async def get_by_date_range(
        self, 
        start_date: date, 
        end_date: date, 
        company_id: int
    ) -> List[Invoice]:
        """
        Obtiene facturas en un rango de fechas.
        
        Args:
            start_date: Fecha de inicio
            end_date: Fecha de fin
            company_id: ID de la empresa
            
        Returns:
            Lista de facturas en el rango de fechas
        """
        result = await self.session.execute(
            select(Invoice).where(
                and_(
                    Invoice.issue_date >= start_date,
                    Invoice.issue_date <= end_date,
                    Invoice.company_id == company_id
                )
            )
        )
        return result.scalars().all()
    
    async def get_overdue_invoices(self, company_id: int) -> List[Invoice]:
        """
        Obtiene facturas vencidas.
        
        Args:
            company_id: ID de la empresa
            
        Returns:
            Lista de facturas vencidas
        """
        today = date.today()
        result = await self.session.execute(
            select(Invoice).where(
                and_(
                    Invoice.due_date < today,
                    Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.SENT]),
                    Invoice.company_id == company_id
                )
            )
        )
        return result.scalars().all()
    
    async def get_monthly_total(self, year: int, month: int, company_id: int) -> float:
        """
        Calcula el total de facturas emitidas en un mes.
        
        Args:
            year: Año
            month: Mes
            company_id: ID de la empresa
            
        Returns:
            Total de facturas del mes
        """
        result = await self.session.execute(
            select(Invoice.total_amount).where(
                and_(
                    Invoice.issue_date.year == year,
                    Invoice.issue_date.month == month,
                    Invoice.company_id == company_id,
                    Invoice.status.in_([InvoiceStatus.APPROVED, InvoiceStatus.SENT, InvoiceStatus.PAID])
                )
            )
        )
        amounts = result.scalars().all()
        return sum(amounts) if amounts else 0.0
