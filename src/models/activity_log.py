"""
Modelo de log de actividades para auditoría.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base


class ActivityLog(Base):
    """
    Modelo de log de actividades del sistema.
    
    Campos:
    - id: Identificador único (PK)
    - user_id: ID del usuario que realizó la acción (FK)
    - action: Tipo de acción realizada
    - details: Detalles de la acción en formato JSON/texto
    - ip_address: Dirección IP del usuario
    - timestamp: Momento en que se realizó la acción
    """
    
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # CARGA_FACTURA, EDICION_CLIENTE, etc.
    details = Column(Text, nullable=True)  # Detalles de la acción
    ip_address = Column(String(45), nullable=True)  # IPv4 o IPv6
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relación con User
    user = relationship("User")
    
    def __repr__(self):
        return f"<ActivityLog(id={self.id}, action='{self.action}', user_id={self.user_id})>"
