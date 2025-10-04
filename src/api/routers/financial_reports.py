"""
Router para reportes financieros con lógica fiscal argentina.
Implementa las reglas de Balance IVA y Balance General según Joni/Hernán.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
<<<<<<< HEAD
from datetime import date
=======
from sqlalchemy import select
>>>>>>> refs/remotes/origin/master
from typing import Optional
from datetime import date

from src.core.database import get_session
<<<<<<< HEAD
from src.services.financial_service import FinancialService
from src.core.security import get_current_user
from src.models.user import User
=======
from src.core.permissions import require_permission, Permission
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice
from src.services.financial_calculator import FinancialCalculator
>>>>>>> refs/remotes/origin/master

router = APIRouter()

@router.get("/financial/balance-iva")
async def get_balance_iva(
<<<<<<< HEAD
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
=======
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Balance IVA según lógica de Joni.
    SOLO facturas tipo A (IVA discriminado).
    """
    # Facturas emitidas (total > 0)
    query_emitidas = select(Invoice).where(Invoice.total > 0, Invoice.is_deleted == False)
    if fecha_desde:
        query_emitidas = query_emitidas.where(Invoice.fecha_emision >= fecha_desde)
    if fecha_hasta:
        query_emitidas = query_emitidas.where(Invoice.fecha_emision <= fecha_hasta)
    
    result_emitidas = await session.execute(query_emitidas)
    facturas_emitidas = result_emitidas.scalars().all()
    
    # Facturas recibidas (total < 0)
    query_recibidas = select(Invoice).where(Invoice.total < 0, Invoice.is_deleted == False)
    if fecha_desde:
        query_recibidas = query_recibidas.where(Invoice.fecha_emision >= fecha_desde)
    if fecha_hasta:
        query_recibidas = query_recibidas.where(Invoice.fecha_emision <= fecha_hasta)
    
    result_recibidas = await session.execute(query_recibidas)
    facturas_recibidas = result_recibidas.scalars().all()
    
    # Calcular con lógica de Joni
    balance = FinancialCalculator.calcular_balance_iva(
        facturas_emitidas=list(facturas_emitidas),
        facturas_recibidas=list(facturas_recibidas)
    )
    
    return balance
>>>>>>> refs/remotes/origin/master

@router.get("/financial/balance-general")
async def get_balance_general(
<<<<<<< HEAD
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
=======
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Balance General (flujo de caja).
    SOLO facturas con movimiento_cuenta=SI.
    """
    query = select(Invoice).where(Invoice.is_deleted == False)
    result = await session.execute(query)
    facturas = result.scalars().all()
    
    balance = FinancialCalculator.calcular_balance_general(
        facturas=list(facturas),
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta
    )
    
    return balance

@router.get("/financial/balance-por-socio")
async def get_balance_por_socio(
    socio: str = Query(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Balance específico de un socio"""
    query = select(Invoice).where(Invoice.is_deleted == False)
    result = await session.execute(query)
    facturas = result.scalars().all()
    
    balance = FinancialCalculator.calcular_balance_por_socio(
        facturas=list(facturas),
        socio=socio
    )
    
    return balance

@router.get("/financial/resumen-completo")
async def get_resumen_completo(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Resumen financiero completo"""
    query = select(Invoice).where(Invoice.is_deleted == False)
    if fecha_desde:
        query = query.where(Invoice.fecha_emision >= fecha_desde)
    if fecha_hasta:
        query = query.where(Invoice.fecha_emision <= fecha_hasta)
    
    result = await session.execute(query)
    facturas = list(result.scalars().all())
    
    # Calcular todos los balances
    balance_general = FinancialCalculator.calcular_balance_general(facturas, fecha_desde, fecha_hasta)
    
    # Balance por socios
    socios = ["Franco", "Joni", "Hernán", "Maxi", "Leo"]
    balances_socios = {
        socio: FinancialCalculator.calcular_balance_por_socio(facturas, socio)
        for socio in socios
    }
    
    return {
        "balance_general": balance_general,
        "balances_por_socio": balances_socios,
        "periodo": {
            "desde": fecha_desde,
            "hasta": fecha_hasta
        }
    }
>>>>>>> refs/remotes/origin/master
