from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .base import Base

class FiscalSettings(Base):
    __tablename__ = "fiscal_settings"

    id = Column(Integer, primary_key=True, index=True)
    fiscal_year_start_month = Column(Integer, nullable=False, default=5) # Mayo
    fiscal_year_end_month = Column(Integer, nullable=False, default=4)   # Abril
    country_code = Column(String(2), default='AR', nullable=False)
    tax_authority = Column(String(50), default='AFIP', nullable=False)
    iva_rate_general = Column(DECIMAL(5,2), default=21.00, nullable=False)
    iva_rate_reduced = Column(DECIMAL(5,2), default=10.50, nullable=False)
    ganancias_rate = Column(DECIMAL(5,2), default=35.00, nullable=False)
    valid_invoice_types = Column(JSON, default=["A", "B", "C", "X"], nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional, if linked to a user

    creator = relationship("User", back_populates="fiscal_settings")

    def __repr__(self):
        return f"<FiscalSettings(id={self.id}, fiscal_year_start_month={self.fiscal_year_start_month})>"

class FiscalSettingsBase(BaseModel):
    fiscal_year_start_month: int = Field(5, description="Mes de inicio del año fiscal (1-12)")
    fiscal_year_end_month: int = Field(4, description="Mes de fin del año fiscal (1-12)")
    country_code: str = Field("AR", max_length=2, description="Código de país (ISO 3166-1 alpha-2)")
    tax_authority: str = Field("AFIP", max_length=50, description="Autoridad fiscal")
    iva_rate_general: float = Field(21.00, description="Tasa general de IVA")
    iva_rate_reduced: float = Field(10.50, description="Tasa reducida de IVA")
    ganancias_rate: float = Field(35.00, description="Tasa de impuesto a las ganancias")
    valid_invoice_types: List[str] = Field(["A", "B", "C", "X"], description="Tipos de factura válidos")

class FiscalSettingsCreate(FiscalSettingsBase):
    pass

class FiscalSettingsUpdate(FiscalSettingsBase):
    pass

class FiscalSettingsResponse(FiscalSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True