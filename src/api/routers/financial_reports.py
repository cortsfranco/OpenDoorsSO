from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional
from src.core.database import get_session
from src.services.financial_service import FinancialService

router = APIRouter(prefix="/financial", tags=["Financial Reports"])

@router.get("/balance-iva")
async def get_balance_iva(
    owner: Optional[str] = Query(None, description="Filtrar por propietario (Hernán, Joni, Maxi, Leo)"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_session)
):
    """
    Obtiene el Balance IVA según normativa argentina.
    
    Balance IVA = IVA de facturas EMITIDAS - IVA de facturas RECIBIDAS
    """
    # TODO: Implementar con FinancialService cuando la estructura de BD esté lista
    # service = FinancialService(db)
    # return await service.get_balance_iva(owner, fecha_desde, fecha_hasta)
    
    # Datos de ejemplo mientras se resuelve la estructura
    return {
        "iva_emitido": 21000.0,
        "iva_recibido": 18000.0,
        "balance_iva": 3000.0,
        "periodo": {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None
        },
        "owner": owner,
        "mensaje": "Datos de ejemplo - estructura de BD en desarrollo"
    }

@router.get("/balance-general")
async def get_balance_general(
    owner: Optional[str] = Query(None, description="Filtrar por propietario (Hernán, Joni, Maxi, Leo)"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_session)
):
    """
    Obtiene el Balance General (flujo de caja real).
    
    Solo cuenta facturas que realmente movieron dinero (movimiento_cuenta = True).
    """
    # TODO: Implementar con FinancialService cuando la estructura de BD esté lista
    # service = FinancialService(db)
    # return await service.get_balance_general(owner, fecha_desde, fecha_hasta)
    
    # Datos de ejemplo mientras se resuelve la estructura
    return {
        "ingresos": 150000.0,
        "egresos": 120000.0,
        "balance_general": 30000.0,
        "periodo": {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None
        },
        "owner": owner,
        "mensaje": "Datos de ejemplo - estructura de BD en desarrollo"
    }
