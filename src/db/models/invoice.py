"""
Modelo de Factura para el sistema de gestión.
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class InvoiceStatus(str, Enum):
    """Estados de una factura."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    SENT = "sent"
    PAID = "paid"
    CANCELLED = "cancelled"


class InvoiceType(str, Enum):
    """Tipos de factura."""
    INVOICE_A = "invoice_a"  # Factura A
    INVOICE_B = "invoice_b"  # Factura B
    INVOICE_C = "invoice_c"  # Factura C
    CREDIT_NOTE = "credit_note"
    DEBIT_NOTE = "debit_note"


class InvoiceBase(SQLModel):
    """Schema base para Factura."""
    invoice_number: str = Field(index=True)
    invoice_type: InvoiceType
    issue_date: date
    due_date: Optional[date] = None
    subtotal: Decimal = Field(decimal_places=2)
    tax_amount: Decimal = Field(decimal_places=2, default=Decimal('0.00'))
    total_amount: Decimal = Field(decimal_places=2)
    status: InvoiceStatus = Field(default=InvoiceStatus.DRAFT)
    notes: Optional[str] = None


class Invoice(InvoiceBase, table=True):
    """
    Modelo de Factura en la base de datos.
    """
    __tablename__ = "invoices"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id")
    client_id: int = Field(foreign_key="clients.id")
    created_by_user_id: int = Field(foreign_key="users.id")
    
    # Campos de AFIP
    cae: Optional[str] = None  # Código de Autorización Electrónico
    cae_due_date: Optional[date] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    company: "Company" = Relationship(back_populates="invoices")
    client: "Client" = Relationship(back_populates="invoices")
    created_by_user: "User" = Relationship(back_populates="created_invoices")
    items: List["InvoiceItem"] = Relationship(back_populates="invoice")


class InvoiceCreate(InvoiceBase):
    """Schema para crear una factura."""
    company_id: int
    client_id: int
    created_by_user_id: int


class InvoiceUpdate(SQLModel):
    """Schema para actualizar una factura."""
    invoice_number: Optional[str] = None
    invoice_type: Optional[InvoiceType] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    cae: Optional[str] = None
    cae_due_date: Optional[date] = None


class InvoiceRead(InvoiceBase):
    """Schema para leer una factura."""
    id: int
    company_id: int
    client_id: int
    created_by_user_id: int
    cae: Optional[str] = None
    cae_due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


class InvoiceItemBase(SQLModel):
    """Schema base para Item de Factura."""
    description: str
    quantity: Decimal = Field(decimal_places=2)
    unit_price: Decimal = Field(decimal_places=2)
    total_price: Decimal = Field(decimal_places=2)


class InvoiceItem(InvoiceItemBase, table=True):
    """
    Modelo de Item de Factura en la base de datos.
    """
    __tablename__ = "invoice_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoices.id")
    
    # Relaciones
    invoice: "Invoice" = Relationship(back_populates="items")


class InvoiceItemCreate(InvoiceItemBase):
    """Schema para crear un item de factura."""
    invoice_id: int


class InvoiceItemUpdate(SQLModel):
    """Schema para actualizar un item de factura."""
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None


class InvoiceItemRead(InvoiceItemBase):
    """Schema para leer un item de factura."""
    id: int
    invoice_id: int
