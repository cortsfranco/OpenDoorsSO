"""
Modelo de usuario para el sistema Open Doors.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class User(Base):
    """
    Modelo de usuario del sistema.
    
    Campos:
    - id: Identificador único (PK)
    - email: Email del usuario (único)
    - hashed_password: Contraseña hasheada
    - full_name: Nombre completo del usuario
    - role: Rol del usuario ('admin', 'user', etc.)
    - is_active: Estado activo del usuario
    - created_at: Fecha de creación
    - updated_at: Fecha de última actualización
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="editor", nullable=False) # editor, approver, admin
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Información personal
    profile_photo_url = Column(String(500), nullable=True)  # URL de foto de perfil
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    birth_date = Column(DateTime, nullable=True)
    
    # Información laboral
    position = Column(String(100), nullable=True)  # Cargo/posición
    department = Column(String(100), nullable=True)  # Departamento
    hire_date = Column(DateTime, nullable=True)  # Fecha de contratación
    salary = Column(Integer, nullable=True)  # Salario (en centavos para evitar decimales)
    
    # Configuraciones del usuario
    preferences = Column(JSON, nullable=True)  # Configuraciones personalizadas
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relación con Invoice
    invoices = relationship("Invoice", back_populates="user", foreign_keys="Invoice.user_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
