"""
Servicio para logging de actividades del sistema.
"""

import json
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.activity_log import ActivityLog


class ActivityLogger:
    """Servicio para registrar actividades del sistema."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def log_activity(
        self,
        user_id: int,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Registra una actividad en el log.
        
        Args:
            user_id: ID del usuario que realizó la acción
            action: Tipo de acción (CARGA_FACTURA, EDICION_CLIENTE, etc.)
            details: Detalles de la acción en formato diccionario
            ip_address: Dirección IP del usuario
        """
        try:
            # Convertir detalles a JSON si es un diccionario
            details_json = json.dumps(details, ensure_ascii=False) if details else None
            
            activity_log = ActivityLog(
                user_id=user_id,
                action=action,
                details=details_json,
                ip_address=ip_address
            )
            
            self.session.add(activity_log)
            await self.session.commit()
            
        except Exception as e:
            # No fallar si el logging falla
            print(f"Error al registrar actividad: {str(e)}")
            await self.session.rollback()
    
    async def get_user_activities(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        limit: int = 100
    ) -> list[ActivityLog]:
        """
        Obtiene actividades del log con filtros opcionales.
        
        Args:
            user_id: Filtrar por usuario específico
            action: Filtrar por tipo de acción
            limit: Límite de resultados
            
        Returns:
            Lista de actividades
        """
        query = select(ActivityLog).order_by(ActivityLog.timestamp.desc())
        
        if user_id:
            query = query.where(ActivityLog.user_id == user_id)
        
        if action:
            query = query.where(ActivityLog.action == action)
        
        query = query.limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()


# Función helper para inyectar el logger
def get_activity_logger(session: AsyncSession) -> ActivityLogger:
    """Retorna una instancia del ActivityLogger."""
    return ActivityLogger(session)
