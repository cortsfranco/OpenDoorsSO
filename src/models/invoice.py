"""
Modelo de factura para el sistema Open Doors.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
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
    invoice_direction = Column(String(20), nullable=False, default="emitida") # 'emitida' o 'recibida'
    
    # Relación con Partner
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True, index=True)
    
    # Campos de aprobación
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending_approval", nullable=False) # pending_approval, approved, paid, rejected
    
    # Campos críticos de lógica financiera
    movimiento_cuenta = Column(Boolean, default=True, nullable=False)  # CRÍTICO: Si afecta flujo de caja
    otros_impuestos = Column(Float, default=0.0, nullable=False)  # Otros impuestos además del IVA
    metodo_pago = Column(String(50), default="transferencia", nullable=False)  # contado, transferencia, tarjeta_credito
    es_compensacion_iva = Column(Boolean, default=False, nullable=False)  # Si es solo para compensar IVA
    
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


# Esquemas Pydantic para API
class InvoiceBase(BaseModel):
    """Esquema base para facturas."""
    filename: str = Field(..., description="Nombre del archivo de la factura")
    categoria: str = Field(..., description="Categoría: ingreso, egreso, compensacion")
    clase: str = Field(..., description="Clase de factura: A, B, C")
    fecha_emision: Optional[datetime] = Field(None, description="Fecha de emisión")
    fecha_ingreso: Optional[datetime] = Field(None, description="Fecha de ingreso al sistema")
    cliente_proveedor: Optional[str] = Field(None, description="Cliente o proveedor")
    detalle: Optional[str] = Field(None, description="Detalle de la factura")
    numero_factura: Optional[str] = Field(None, description="Número de factura")
    monto_total: Optional[float] = Field(None, description="Monto total")
    monto_iva: Optional[float] = Field(None, description="Monto de IVA")
    estado_pago: str = Field(default="pendiente", description="Estado del pago")
    owner: Optional[str] = Field(None, description="Propietario de la factura")
    invoice_direction: str = Field(default="recibida", description="Dirección: 'emitida' o 'recibida'")
    movimiento_cuenta: bool = Field(default=True, description="Si afecta el flujo de caja real")
    otros_impuestos: float = Field(default=0.0, description="Otros impuestos")
    metodo_pago: str = Field(default="transferencia", description="Método de pago")
    es_compensacion_iva: bool = Field(default=False, description="Si es solo para compensar IVA")

class InvoiceCreate(InvoiceBase):
    """Esquema para crear facturas."""
    pass

class InvoiceUpdate(BaseModel):
    """Esquema para actualizar facturas."""
    categoria: Optional[str] = None
    clase: Optional[str] = None
    fecha_emision: Optional[datetime] = None
    cliente_proveedor: Optional[str] = None
    detalle: Optional[str] = None
    numero_factura: Optional[str] = None
    monto_total: Optional[float] = None
    monto_iva: Optional[float] = None
    estado_pago: Optional[str] = None
    owner: Optional[str] = None
    invoice_direction: Optional[str] = None
    movimiento_cuenta: Optional[bool] = None
    otros_impuestos: Optional[float] = None
    metodo_pago: Optional[str] = None
    es_compensacion_iva: Optional[bool] = None

class InvoiceResponse(InvoiceBase):
    """Esquema de respuesta para facturas."""
    id: int
    user_id: int
    status: str
    upload_date: datetime
    payment_status: str
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    blob_url: Optional[str] = None
    partner_id: Optional[int] = None
    
    class Config:
        from_attributes = True
