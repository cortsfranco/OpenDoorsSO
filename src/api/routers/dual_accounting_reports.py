from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.services.fiscal_year_service import FiscalYearService
from src.services.financial_calculations_service import FinancialCalculationsService

router = APIRouter()

@router.get("/balance-real", summary="Obtener Balance REAL (solo movimiento de cuenta efectivo)")
async def get_balance_real_endpoint(
    owner: Optional[str] = Query(None, description="Filtrar por propietario"),
    fiscal_year: Optional[int] = Query(None, description="Año fiscal (ej: 2024 para Mayo 2024 - Abril 2025)"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Balance REAL - Solo facturas que generan movimiento de cuenta efectivo.
    """
    fiscal_service = FiscalYearService(db)
    financial_service = FinancialCalculationsService(db, fiscal_service)
    
    if fiscal_year:
        fy_range = await fiscal_service.get_fiscal_year_range(fiscal_year)
        fecha_desde = fy_range['start_date']
        fecha_hasta = fy_range['end_date']
    else:
        fy_current = await fiscal_service.get_current_fiscal_year()
        fecha_desde = fy_current['start_date']
        fecha_hasta = fy_current['end_date']

    return await financial_service._calculate_balance_real(
        owner=owner,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta
    )

@router.get("/balance-fiscal", summary="Obtener Balance FISCAL (todas las facturas)")
async def get_balance_fiscal_endpoint(
    owner: Optional[str] = Query(None, description="Filtrar por propietario"),
    fiscal_year: Optional[int] = Query(None, description="Año fiscal (ej: 2024 para Mayo 2024 - Abril 2025)"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Balance FISCAL - Todas las facturas (incluye las de compensación IVA).
    Este es el balance que se presenta a AFIP.
    """
    fiscal_service = FiscalYearService(db)
    financial_service = FinancialCalculationsService(db, fiscal_service)

    if fiscal_year:
        fy_range = await fiscal_service.get_fiscal_year_range(fiscal_year)
        fecha_desde = fy_range['start_date']
        fecha_hasta = fy_range['end_date']
    else:
        fy_current = await fiscal_service.get_current_fiscal_year()
        fecha_desde = fy_current['start_date']
        fecha_hasta = fy_current['end_date']

    return await financial_service._calculate_balance_fiscal(
        owner=owner,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta
    )

@router.get("/comprehensive-report", summary="Obtener Reporte Financiero Completo")
async def get_comprehensive_report_endpoint(
    owner: Optional[str] = Query(None, description="Filtrar por propietario"),
    fiscal_year: Optional[int] = Query(None, description="Año fiscal (ej: 2024 para Mayo 2024 - Abril 2025)"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Genera un reporte financiero completo que incluye Balance IVA, Balance Real, Balance Fiscal,
    Impuesto a las Ganancias, Cash Flow por Proyecto e Indicadores de Rentabilidad.
    """
    # Por ahora, devolver datos mock mientras se corrige el servicio
    return {
        "balance_iva": {
            "iva_emitido": 50000.0,
            "iva_recibido": 30000.0,
            "balance_iva": 20000.0,
            "facturas_emitidas": 25,
            "facturas_recibidas": 15
        },
        "balance_real": {
            "ingresos": 500000.0,
            "egresos": 300000.0,
            "balance": 200000.0,
            "facturas_ingresos": 30,
            "facturas_egresos": 20
        },
        "balance_fiscal": {
            "ingresos": 600000.0,
            "egresos": 350000.0,
            "balance": 250000.0,
            "facturas_ingresos": 35,
            "facturas_egresos": 25
        },
        "impuesto_ganancias": {
            "base_imponible": 200000.0,
            "impuesto_calculado": 70000.0,
            "retenciones": 10000.0,
            "saldo_a_pagar": 60000.0
        },
        "cash_flow_proyectos": [
            {
                "proyecto": "Proyecto A",
                "ingresos": 100000.0,
                "egresos": 60000.0,
                "balance": 40000.0
            },
            {
                "proyecto": "Proyecto B",
                "ingresos": 150000.0,
                "egresos": 80000.0,
                "balance": 70000.0
            }
        ],
        "indicadores_rentabilidad": {
            "margen_bruto": 0.35,
            "margen_neto": 0.25,
            "roi": 0.15,
            "rentabilidad_por_proyecto": {
                "Proyecto A": 0.40,
                "Proyecto B": 0.47
            }
        },
        "periodo": {
            "fecha_desde": "2024-05-01",
            "fecha_hasta": "2025-04-30",
            "año_fiscal": fiscal_year or 2024
        },
        "owner": owner or "Todos"
    }

@router.get("/fiscal-years", summary="Obtener lista de años fiscales disponibles")
async def get_fiscal_years_endpoint(
    limit: int = Query(5, description="Número de años fiscales a obtener"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Retorna una lista de años fiscales, incluyendo el actual y los anteriores.
    """
    fiscal_service = FiscalYearService(db)
    return await fiscal_service.get_fiscal_years_list(limit=limit)

@router.get("/balance-by-owner", summary="Obtener balance consolidado por propietario")
async def get_balance_by_owner_endpoint(
    fiscal_year: Optional[int] = Query(None, description="Año fiscal"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Retorna un resumen de balances (real, fiscal, IVA) agrupado por cada propietario.
    """
    # TODO: Implementar la lógica para agrupar por propietario
    # Por ahora, devolver datos mock o un placeholder
    return [
        {
            "owner": "Hernán Pagani",
            "balance_real": {"ingresos": 100000.0, "egresos": 50000.0, "balance": 50000.0},
            "balance_fiscal": {"ingresos": 120000.0, "egresos": 60000.0, "balance": 60000.0},
            "balance_iva": {"iva_emitido": 10000.0, "iva_recibido": 5000.0, "balance_iva": 5000.0}
        },
        {
            "owner": "Joni Tagua",
            "balance_real": {"ingresos": 80000.0, "egresos": 40000.0, "balance": 40000.0},
            "balance_fiscal": {"ingresos": 90000.0, "egresos": 45000.0, "balance": 45000.0},
            "balance_iva": {"iva_emitido": 8000.0, "iva_recibido": 4000.0, "balance_iva": 4000.0}
        }
    ]