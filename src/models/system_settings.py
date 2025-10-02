"""
Modelo de configuraciones del sistema Open Doors.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text
from sqlalchemy.sql import func
from .base import Base


class SystemSettings(Base):
    """
    Modelo para configuraciones del sistema.
    
    Campos:
    - id: Identificador único (PK)
    - key: Clave única de la configuración
    - value: Valor de la configuración (JSON)
    - description: Descripción de la configuración
    - category: Categoría de la configuración
    - is_active: Estado activo de la configuración
    - created_at: Fecha de creación
    - updated_at: Fecha de última actualización
    """
    
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # currency, fiscal, backup, ui, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<SystemSettings(key='{self.key}', category='{self.category}')>"


class FiscalYear(Base):
    """
    Modelo para años fiscales.
    
    Campos:
    - id: Identificador único (PK)
    - year: Año fiscal
    - start_date: Fecha de inicio del año fiscal
    - end_date: Fecha de fin del año fiscal
    - is_current: Si es el año fiscal actual
    - created_at: Fecha de creación
    """
    
    __tablename__ = "fiscal_years"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, index=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<FiscalYear(year={self.year}, current={self.is_current})>"


class BackupLog(Base):
    """
    Modelo para logs de backup.
    
    Campos:
    - id: Identificador único (PK)
    - backup_type: Tipo de backup (daily, manual, etc.)
    - file_path: Ruta del archivo de backup
    - file_size: Tamaño del archivo en bytes
    - status: Estado del backup (success, failed, in_progress)
    - started_at: Fecha de inicio
    - completed_at: Fecha de finalización
    - error_message: Mensaje de error si falló
    """
    
    __tablename__ = "backup_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    backup_type = Column(String(50), nullable=False)  # daily, manual, scheduled
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # en bytes
    status = Column(String(20), nullable=False)  # success, failed, in_progress
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<BackupLog(type='{self.backup_type}', status='{self.status}')>"
