"""
Modelo de factura para el sistema Open Doors.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Float, Date, Numeric, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from .base import Base


# ==================== ENUMS FISCALES ARGENTINOS ====================
class TipoFactura(str, Enum):
    """Tipos de factura según normativa argentina AFIP"""
    A = "A"  # Factura A - CON IVA discriminado (para Balance IVA según Joni)
    B = "B"  # Factura B - IVA incluido
    C = "C"  # Factura C - Sin IVA
    X = "X"  # Comprobante X - Otros

class MovimientoCuenta(str, Enum):
    """Indica si la factura afecta el flujo de caja real (lógica de Joni)"""
    SI = "SI"    # Afecta Balance General (cash flow real)
    NO = "NO"    # No afecta Balance General (ej: compensaciones)

class MetodoPago(str, Enum):
    """Métodos de pago disponibles"""
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    CHEQUE = "cheque"
    TARJETA = "tarjeta"
    CREDITO = "credito"
    OTRO = "otro"

class Partner(str, Enum):
    """Socios de Open Doors - Multi-partner tracking"""
    FRANCO = "Franco"
    JONI = "Joni"
    HERNAN = "Hernán"
    MAXI = "Maxi"
    LEO = "Leo"


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
    
    # ==================== CAMPOS FISCALES CRÍTICOS ====================
    tipo_factura = Column(SQLEnum(TipoFactura), nullable=False, default=TipoFactura.A)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    subtotal = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    monto_iva = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    otros_impuestos = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(15, 2), nullable=False)
    socio_responsable = Column(SQLEnum(Partner), nullable=True)
    proyecto_asociado = Column(String(100), nullable=True)
    
    # Campos críticos de lógica financiera
    movimiento_cuenta = Column(SQLEnum(MovimientoCuenta), default=MovimientoCuenta.SI, nullable=False)  # CRÍTICO: Si afecta flujo de caja
    tipo_contabilidad = Column(String(20), default="fiscal", nullable=False)  # 'real', 'fiscal', 'ambas'
    metodo_pago = Column(SQLEnum(MetodoPago), default=MetodoPago.TRANSFERENCIA, nullable=False)
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
    tipo_factura: TipoFactura = Field(default=TipoFactura.A, description="Tipo de factura: A, B, C, X")
    fecha_emision: date = Field(..., description="Fecha de emisión")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha de vencimiento")
    cliente_proveedor: Optional[str] = Field(None, description="Cliente o proveedor")
    detalle: Optional[str] = Field(None, description="Detalle de la factura")
    numero_factura: Optional[str] = Field(None, description="Número de factura")
    subtotal: Decimal = Field(default=Decimal("0.00"), description="Subtotal sin IVA")
    monto_iva: Decimal = Field(default=Decimal("0.00"), description="Monto de IVA")
    otros_impuestos: Decimal = Field(default=Decimal("0.00"), description="Otros impuestos")
    total: Decimal = Field(..., description="Monto total")
    socio_responsable: Optional[Partner] = Field(None, description="Socio responsable")
    proyecto_asociado: Optional[str] = Field(None, description="Proyecto asociado")
    estado_pago: str = Field(default="pendiente", description="Estado del pago")
    owner: Optional[str] = Field(None, description="Propietario de la factura")
    invoice_direction: str = Field(default="recibida", description="Dirección: 'emitida' o 'recibida'")
    movimiento_cuenta: MovimientoCuenta = Field(default=MovimientoCuenta.SI, description="Si afecta el flujo de caja real")
    tipo_contabilidad: str = Field(default="fiscal", description="Tipo: 'real', 'fiscal', 'ambas'")
    metodo_pago: MetodoPago = Field(default=MetodoPago.TRANSFERENCIA, description="Método de pago")
    es_compensacion_iva: bool = Field(default=False, description="Si es solo para compensar IVA")

class InvoiceCreate(InvoiceBase):
    """Esquema para crear facturas."""
    pass

class InvoiceUpdate(BaseModel):
    """Esquema para actualizar facturas."""
    categoria: Optional[str] = None
    tipo_factura: Optional[TipoFactura] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    cliente_proveedor: Optional[str] = None
    detalle: Optional[str] = None
    numero_factura: Optional[str] = None
    subtotal: Optional[Decimal] = None
    monto_iva: Optional[Decimal] = None
    otros_impuestos: Optional[Decimal] = None
    total: Optional[Decimal] = None
    socio_responsable: Optional[Partner] = None
    proyecto_asociado: Optional[str] = None
    estado_pago: Optional[str] = None
    owner: Optional[str] = None
    invoice_direction: Optional[str] = None
    movimiento_cuenta: Optional[MovimientoCuenta] = None
    metodo_pago: Optional[MetodoPago] = None
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
