"""
Router para reportes financieros con lógica fiscal argentina.
Implementa las reglas de Balance IVA y Balance General según Joni/Hernán.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import Optional
from src.core.database import get_session
from src.services.financial_service import FinancialService
from src.core.security import get_current_user
from src.models.user import User

router = APIRouter(prefix="/financial", tags=["Financial Reports"])

@router.get("/balance-iva")
async def get_balance_iva(
    owner: Optional[str] = Query(None, description="Filtrar por socio (Hernán, Joni, Maxi, Leo, Franco)"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el Balance IVA según normativa argentina.
    
    REGLA DE JONI: Solo facturas tipo A.
    Balance IVA = IVA de facturas EMITIDAS - IVA de facturas RECIBIDAS
    
    Args:
        owner: Socio responsable (opcional)
        fecha_desde: Fecha inicio del período (opcional)
        fecha_hasta: Fecha fin del período (opcional)
    
    Returns:
        Balance IVA con débito fiscal, crédito fiscal y estado
    """
    try:
        service = FinancialService(db)
        resultado = await service.get_balance_iva(owner, fecha_desde, fecha_hasta)
        
        resultado["periodo"] = {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None
        }
        resultado["owner"] = owner
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular Balance IVA: {str(e)}")

@router.get("/balance-general")
async def get_balance_general(
    owner: Optional[str] = Query(None, description="Filtrar por socio (Hernán, Joni, Maxi, Leo, Franco)"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el Balance General (flujo de caja real).
    
    REGLA DE JONI: Solo facturas con movimiento_cuenta = True.
    No cuenta facturas de compensación de IVA.
    
    Args:
        owner: Socio responsable (opcional)
        fecha_desde: Fecha inicio del período (opcional)
        fecha_hasta: Fecha fin del período (opcional)
    
    Returns:
        Balance General con ingresos, egresos y estado
    """
    try:
        service = FinancialService(db)
        resultado = await service.get_balance_general(owner, fecha_desde, fecha_hasta)
        
        resultado["periodo"] = {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None
        }
        resultado["owner"] = owner
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular Balance General: {str(e)}")

@router.get("/balance-por-socio")
async def get_balance_por_socio(
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el balance de IVA y General separado por cada socio.
    
    Devuelve información individualizada para:
    - Hernán
    - Joni
    - Maxi
    - Leo
    - Franco
    
    Args:
        fecha_desde: Fecha inicio del período (opcional)
        fecha_hasta: Fecha fin del período (opcional)
    
    Returns:
        Diccionario con balance de cada socio
    """
    try:
        service = FinancialService(db)
        resultado = await service.get_balance_por_socio(fecha_desde, fecha_hasta)
        
        resultado["periodo"] = {
            "desde": fecha_desde.isoformat() if fecha_desde else None,
            "hasta": fecha_hasta.isoformat() if fecha_hasta else None
        }
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular balance por socio: {str(e)}")
