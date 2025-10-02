"""
Modelo de Cliente para el sistema de gestión.
"""

from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class ClientBase(SQLModel):
    """Schema base para Cliente."""
    name: str = Field(index=True)
    tax_id: Optional[str] = Field(default=None, index=True)  # CUIT/CUIL
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = Field(default=True)


class Client(ClientBase, table=True):
    """
    Modelo de Cliente en la base de datos.
    """
    __tablename__ = "clients"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    company: "Company" = Relationship(back_populates="clients")
    invoices: List["Invoice"] = Relationship(back_populates="client")


class ClientCreate(ClientBase):
    """Schema para crear un cliente."""
    company_id: int


class ClientUpdate(SQLModel):
    """Schema para actualizar un cliente."""
    name: Optional[str] = None
    tax_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class ClientRead(ClientBase):
    """Schema para leer un cliente."""
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime
