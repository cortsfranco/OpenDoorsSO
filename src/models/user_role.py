"""
Modelos para roles y permisos de usuarios.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

from .base import Base

# Tabla de asociación para permisos de usuario
user_permissions = Table(
    'user_permissions',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

class UserRole(str, Enum):
    """Roles de usuario disponibles."""
    ADMIN = "admin"
    CONTADOR = "contador"
    SOCIO = "socio"
    OPERARIO = "operario"
    READONLY = "readonly"

class Permission(Base):
    """Modelo de permisos."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    resource = Column(String(100), nullable=False)  # recurso al que se aplica (invoices, users, etc.)
    action = Column(String(50), nullable=False)     # acción (create, read, update, delete)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    users = relationship("User", secondary=user_permissions, back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, name='{self.name}', resource='{self.resource}', action='{self.action}')>"

class RolePermission(Base):
    """Modelo para asignar permisos a roles."""
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relaciones
    permission = relationship("Permission")

    def __repr__(self):
        return f"<RolePermission(role='{self.role}', permission_id={self.permission_id})>"

# Esquemas Pydantic
class PermissionBase(BaseModel):
    name: str = Field(..., max_length=100, description="Nombre del permiso")
    description: Optional[str] = Field(None, max_length=255, description="Descripción del permiso")
    resource: str = Field(..., max_length=100, description="Recurso al que se aplica")
    action: str = Field(..., max_length=50, description="Acción permitida")

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    resource: Optional[str] = Field(None, max_length=100)
    action: Optional[str] = Field(None, max_length=50)

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RolePermissionBase(BaseModel):
    role: UserRole = Field(..., description="Rol de usuario")
    permission_id: int = Field(..., description="ID del permiso")

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionResponse(RolePermissionBase):
    id: int
    created_at: datetime
    permission: PermissionResponse

    class Config:
        from_attributes = True

class UserRoleInfo(BaseModel):
    """Información de rol de usuario."""
    role: UserRole
    permissions: List[PermissionResponse]
    is_admin: bool
    can_manage_users: bool
    can_approve_invoices: bool
    can_access_reports: bool

class UserWithPermissions(BaseModel):
    """Usuario con información de permisos."""
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    permissions: List[PermissionResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

