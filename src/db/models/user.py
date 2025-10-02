"""
Modelo de Usuario para el sistema de gestión.
"""

from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuario en el sistema."""
    ADMIN = "admin"
    FINANCE_USER = "finance_user"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class UserBase(SQLModel):
    """Schema base para Usuario."""
    email: str = Field(unique=True, index=True)
    full_name: str
    is_active: bool = Field(default=True)
    role: UserRole = Field(default=UserRole.EMPLOYEE)


class User(UserBase, table=True):
    """
    Modelo de Usuario en la base de datos.
    """
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    company_id: Optional[int] = Field(default=None, foreign_key="companies.id")
    company: Optional["Company"] = Relationship(back_populates="users")
    
    # Relaciones con facturas (como creador)
    created_invoices: List["Invoice"] = Relationship(back_populates="created_by_user")


class UserCreate(UserBase):
    """Schema para crear un usuario."""
    password: str


class UserUpdate(SQLModel):
    """Schema para actualizar un usuario."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    company_id: Optional[int] = None


class UserRead(UserBase):
    """Schema para leer un usuario."""
    id: int
    created_at: datetime
    updated_at: datetime
    company_id: Optional[int] = None
