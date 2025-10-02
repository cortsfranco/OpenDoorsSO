"""
Modelo para la gestión de socios/proveedores.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    cuit = Column(String(20), nullable=True, unique=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    contact_person = Column(String(255), nullable=True)
    business_type = Column(String(100), nullable=True)  # 'cliente', 'proveedor', 'socio'
    tax_category = Column(String(50), nullable=True)  # 'responsable_inscripto', 'monotributo', etc.
    payment_terms = Column(String(100), nullable=True)  # 'contado', '30_dias', etc.
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Campos adicionales para datos fiscales
    fiscal_data = Column(JSON, nullable=True)  # Para datos específicos de facturación
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relación con facturas
    invoices = relationship("Invoice", back_populates="partner")

    def __repr__(self):
        return f"<Partner(id={self.id}, name='{self.name}', business_type='{self.business_type}')>"
