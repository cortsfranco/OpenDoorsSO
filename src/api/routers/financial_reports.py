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
    service = FinancialService(db)
    return await service.get_balance_iva(owner, fecha_desde, fecha_hasta)

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
    service = FinancialService(db)
    return await service.get_balance_general(owner, fecha_desde, fecha_hasta)
