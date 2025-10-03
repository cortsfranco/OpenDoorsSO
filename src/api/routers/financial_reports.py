from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import date

from src.core.database import get_session
from src.core.permissions import require_permission, Permission
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice
from src.services.financial_calculator import FinancialCalculator

router = APIRouter()

@router.get("/financial/balance-iva")
async def get_balance_iva(
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

@router.get("/financial/balance-general")
async def get_balance_general(
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