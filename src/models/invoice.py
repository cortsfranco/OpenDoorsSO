"""
Modelo de factura para el sistema Open Doors.
Alineado con la lógica fiscal argentina de Joni/Hernán.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, DECIMAL, Date, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from .base import Base


class Invoice(Base):
    """
    Modelo de factura del sistema Open Doors.
    
    Estructura basada en el Excel de facturación de Joni/Hernán:
    - Soporta facturas tipo A, B, C según normativa argentina
    - Diferencia entre Balance IVA (solo tipo A) y Balance General (mov_cuenta=SI)
    - Separa por socio: Hernán, Joni, Maxi, Leo, Franco
    - Maneja formato de moneda argentina: $1.234,56
    """
    
    __tablename__ = "invoices"
    
    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    
    # Estado de procesamiento Azure AI
    status = Column(String(50), default="pending", nullable=False, index=True)
    # Valores: pending, processing, completed, error, needs_review
    
    # ===== CAMPOS FISCALES ARGENTINOS (según Excel de Joni/Hernán) =====
    
    # Tipo de factura: A, B, C
    tipo_factura = Column(String(1), nullable=True, index=True)  # 'A', 'B', 'C'
    
    # Número de factura
    numero_factura = Column(String(50), nullable=True, index=True)
    
    # CUIT del emisor/receptor (formato: XX-XXXXXXXX-X)
    cuit = Column(String(13), nullable=True)
    
    # Razón social del cliente/proveedor
    razon_social = Column(String(255), nullable=True)
    
    # Fechas (según columnas del Excel)
    fecha_emision = Column(Date, nullable=True, index=True)  # Fecha de emisión
    fecha_vencimiento = Column(Date, nullable=True)  # Fecha de vencimiento
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # ===== MONTOS EN FORMATO ARGENTINO (usar DECIMAL para precisión) =====
    
    # Subtotal (sin IVA ni otros impuestos)
    subtotal = Column(DECIMAL(15, 2), nullable=True)
    
    # IVA
    iva_porcentaje = Column(DECIMAL(5, 2), default=Decimal('21.00'))  # 21% por defecto
    iva_monto = Column(DECIMAL(15, 2), nullable=True)
    
    # Otros impuestos (impuesto al cheque, ingresos brutos, etc.)
    otros_impuestos = Column(DECIMAL(15, 2), default=Decimal('0.00'))
    
    # Total de la factura
    total = Column(DECIMAL(15, 2), nullable=True)
    
    # Moneda (ARS por defecto para Argentina)
    moneda = Column(String(3), default='ARS')
    
    # ===== DIRECCIÓN Y CLASIFICACIÓN =====
    
    # Dirección: 'emitida' (venta) o 'recibida' (compra)
    invoice_direction = Column(String(10), nullable=False, default="recibida", index=True)
    
    # Socio responsable: Hernán, Joni, Maxi, Leo, Franco
    owner = Column(String(100), nullable=True, index=True)
    
    # ===== LÓGICA FISCAL CRÍTICA (según explicación de Joni) =====
    
    # Movimiento de cuenta: SI = afecta flujo de caja real (Balance General)
    #                        NO = solo para compensar IVA (no es movimiento real)
    movimiento_cuenta = Column(Boolean, default=True, nullable=False, index=True)
    
    # Es compensación IVA: True = factura creada SOLO para compensar IVA
    # (ejemplo: factura de caramelos para recuperar IVA, no es gasto real)
    es_compensacion_iva = Column(Boolean, default=False, nullable=False)
    
    # ===== PARTNER (Cliente/Proveedor) =====
    
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True, index=True)
    
    # ===== APROBACIÓN Y PAGO =====
    
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending_approval", nullable=False)
    # Valores: pending_approval, approved, paid, rejected
    
    metodo_pago = Column(String(50), default="transferencia")
    # Valores: contado, transferencia, tarjeta_credito, cheque
    
    # ===== DATOS AZURE AI =====
    
    extracted_data = Column(JSON, nullable=True)  # Datos extraídos por Azure Document Intelligence
    blob_url = Column(String(500), nullable=True)  # URL en Azure Blob Storage
    
    # ===== SOFT DELETE =====
    
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # ===== AUDITORÍA =====
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # ===== RELACIONES =====
    
    user = relationship("User", back_populates="invoices", foreign_keys=[user_id])
    partner = relationship("Partner", back_populates="invoices")
    
    # ===== CONSTRAINTS =====
    
    __table_args__ = (
        CheckConstraint("tipo_factura IN ('A', 'B', 'C') OR tipo_factura IS NULL", name="chk_tipo_factura"),
        CheckConstraint("invoice_direction IN ('emitida', 'recibida')", name="chk_direccion"),
        CheckConstraint("payment_status IN ('pending_approval', 'approved', 'paid', 'rejected')", name="chk_payment_status"),
    )
    
    def __repr__(self):
        return f"<Invoice(id={self.id}, tipo={self.tipo_factura}, numero='{self.numero_factura}', owner='{self.owner}', total={self.total})>"


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
