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


# ===== ESQUEMAS PYDANTIC PARA API =====

class InvoiceBase(BaseModel):
    """Esquema base para facturas según estructura de Joni/Hernán."""
    filename: str = Field(..., description="Nombre del archivo de la factura")
    tipo_factura: Optional[str] = Field(None, description="Tipo de factura: A, B, C")
    numero_factura: Optional[str] = Field(None, description="Número de factura")
    cuit: Optional[str] = Field(None, description="CUIT del emisor/receptor (formato XX-XXXXXXXX-X)")
    razon_social: Optional[str] = Field(None, description="Razón social del cliente/proveedor")
    
    # Fechas
    fecha_emision: Optional[date] = Field(None, description="Fecha de emisión")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha de vencimiento")
    
    # Montos en formato argentino
    subtotal: Optional[Decimal] = Field(None, description="Subtotal sin IVA")
    iva_porcentaje: Optional[Decimal] = Field(Decimal('21.00'), description="Porcentaje de IVA (21% o 10.5%)")
    iva_monto: Optional[Decimal] = Field(None, description="Monto de IVA")
    otros_impuestos: Optional[Decimal] = Field(Decimal('0.00'), description="Otros impuestos")
    total: Optional[Decimal] = Field(None, description="Total de la factura")
    moneda: Optional[str] = Field('ARS', description="Moneda (ARS)")
    
    # Dirección y clasificación
    invoice_direction: str = Field(default="recibida", description="Dirección: 'emitida' o 'recibida'")
    owner: Optional[str] = Field(None, description="Socio responsable: Hernán, Joni, Maxi, Leo, Franco")
    
    # Lógica fiscal crítica
    movimiento_cuenta: bool = Field(default=True, description="SI = afecta Balance General, NO = solo IVA")
    es_compensacion_iva: bool = Field(default=False, description="Si es SOLO para compensar IVA")
    
    # Aprobación y pago
    payment_status: Optional[str] = Field("pending_approval", description="Estado de pago")
    metodo_pago: Optional[str] = Field("transferencia", description="Método de pago")
    
    # Partner
    partner_id: Optional[int] = Field(None, description="ID del cliente/proveedor")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None,
            date: lambda v: v.isoformat() if v is not None else None
        }


class InvoiceCreate(InvoiceBase):
    """Esquema para crear facturas."""
    pass


class InvoiceUpdate(BaseModel):
    """Esquema para actualizar facturas."""
    tipo_factura: Optional[str] = None
    numero_factura: Optional[str] = None
    cuit: Optional[str] = None
    razon_social: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    subtotal: Optional[Decimal] = None
    iva_porcentaje: Optional[Decimal] = None
    iva_monto: Optional[Decimal] = None
    otros_impuestos: Optional[Decimal] = None
    total: Optional[Decimal] = None
    invoice_direction: Optional[str] = None
    owner: Optional[str] = None
    movimiento_cuenta: Optional[bool] = None
    es_compensacion_iva: Optional[bool] = None
    payment_status: Optional[str] = None
    metodo_pago: Optional[str] = None
    partner_id: Optional[int] = None

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None,
            date: lambda v: v.isoformat() if v is not None else None
        }


class InvoiceResponse(BaseModel):
    """Esquema de respuesta completo para facturas."""
    id: int
    user_id: int
    filename: str
    status: str
    
    # Campos fiscales
    tipo_factura: Optional[str] = None
    numero_factura: Optional[str] = None
    cuit: Optional[str] = None
    razon_social: Optional[str] = None
    
    # Fechas
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    upload_date: datetime
    
    # Montos
    subtotal: Optional[Decimal] = None
    iva_porcentaje: Optional[Decimal] = None
    iva_monto: Optional[Decimal] = None
    otros_impuestos: Optional[Decimal] = None
    total: Optional[Decimal] = None
    moneda: Optional[str] = None
    
    # Dirección y clasificación
    invoice_direction: str
    owner: Optional[str] = None
    
    # Lógica fiscal
    movimiento_cuenta: bool
    es_compensacion_iva: bool
    
    # Aprobación
    payment_status: str
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    metodo_pago: Optional[str] = None
    
    # Datos adicionales
    blob_url: Optional[str] = None
    partner_id: Optional[int] = None
    extracted_data: Optional[dict] = None
    
    # Soft delete
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    
    # Auditoría
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None,
            date: lambda v: v.isoformat() if v is not None else None,
            datetime: lambda v: v.isoformat() if v is not None else None
        }
