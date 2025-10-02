"""
Modelo de factura para el sistema Open Doors.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class Invoice(Base):
    """
    Modelo de factura del sistema.
    
    Campos:
    - id: Identificador único (PK)
    - user_id: ID del usuario propietario (FK)
    - filename: Nombre del archivo original
    - status: Estado del procesamiento ('pending', 'processing', 'completed', 'error')
    - upload_date: Fecha de subida
    - extracted_data: Datos extraídos en formato JSON
    - blob_url: URL del archivo en Azure Blob Storage
    - created_at: Fecha de creación
    - updated_at: Fecha de última actualización
    """
    
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, processing, completed, error, needs_review
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    extracted_data = Column(JSON, nullable=True)
    blob_url = Column(String(500), nullable=True)
    owner = Column(String(100), nullable=True) # Propietario de la factura
    
    # Relación con Partner
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True, index=True)
    
    # Campos de aprobación
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending_approval", nullable=False) # pending_approval, approved, paid, rejected
    
    # Campos críticos de lógica financiera
    movimiento_cuenta = Column(Boolean, default=True, nullable=False)  # CRÍTICO: Si afecta flujo de caja
    otros_impuestos = Column(Float, default=0.0, nullable=False)  # Otros impuestos además del IVA
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relación con User
    user = relationship("User", back_populates="invoices", foreign_keys=[user_id])
    
    # Relación con Partner
    partner = relationship("Partner", back_populates="invoices")
    
    def __repr__(self):
        return f"<Invoice(id={self.id}, filename='{self.filename}', status='{self.status}')>"
