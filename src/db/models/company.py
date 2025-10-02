"""
Modelo de Empresa para el sistema de gestión.
"""

from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class CompanyBase(SQLModel):
    """Schema base para Empresa."""
    name: str = Field(index=True)
    tax_id: str = Field(unique=True, index=True)  # CUIT/CUIL
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = Field(default=True)


class Company(CompanyBase, table=True):
    """
    Modelo de Empresa en la base de datos.
    """
    __tablename__ = "companies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    users: List["User"] = Relationship(back_populates="company")
    clients: List["Client"] = Relationship(back_populates="company")
    invoices: List["Invoice"] = Relationship(back_populates="company")


class CompanyCreate(CompanyBase):
    """Schema para crear una empresa."""
    pass


class CompanyUpdate(SQLModel):
    """Schema para actualizar una empresa."""
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyRead(CompanyBase):
    """Schema para leer una empresa."""
    id: int
    created_at: datetime
    updated_at: datetime
