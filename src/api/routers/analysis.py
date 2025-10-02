"""
Router para análisis financiero con IA.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.agents.enhanced_financial_analysis_agent import EnhancedFinancialAnalysisAgent

router = APIRouter()


class AnalysisRequest(BaseModel):
    """Solicitud de análisis."""
    query: str
    period: Optional[str] = "current_quarter"


class AnalysisResponse(BaseModel):
    """Respuesta de análisis."""
    query: str
    analysis: str
    charts: list
    data: dict
    error: Optional[str] = None


@router.post("/", response_model=AnalysisResponse)
async def analyze_financial_data(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Analiza datos financieros usando IA basándose en una consulta en lenguaje natural.
    
    Args:
        request: Consulta y parámetros de análisis
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Análisis estructurado con datos y gráficos
    """
    try:
        # Crear agente de análisis
        analysis_agent = EnhancedFinancialAnalysisAgent(session)
        
        # Ejecutar análisis
        result = await analysis_agent.analyze_query(request.query, current_user.id)
        
        return AnalysisResponse(
            query=result["query"],
            analysis=result["analysis"],
            charts=result.get("charts", []),
            data=result.get("data", {}),
            error=result.get("error")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al realizar análisis: {str(e)}"
        )


@router.get("/tools")
async def get_available_tools():
    """
    Retorna las herramientas de análisis disponibles.
    """
    return {
        "available_tools": [
            {
                "name": "calculate_iva_balance",
                "description": "Calcula el balance de IVA según la lógica fiscal argentina",
                "example": "¿Cuál es mi balance de IVA este trimestre?"
            },
            {
                "name": "determine_fiscal_year",
                "description": "Determina el año fiscal correspondiente",
                "example": "¿En qué año fiscal estamos?"
            },
            {
                "name": "calculate_profitability",
                "description": "Calcula métricas de rentabilidad y márgenes",
                "example": "¿Cuál es mi rentabilidad actual?"
            },
            {
                "name": "get_invoice_summary",
                "description": "Obtiene resumen de facturas por período",
                "example": "Muéstrame un resumen de mis facturas"
            },
            {
                "name": "generate_chart_data",
                "description": "Genera datos para gráficos específicos",
                "example": "Muéstrame un gráfico de ingresos mensuales"
            }
        ],
        "example_queries": [
            "Analiza mi balance de IVA del último trimestre",
            "¿Cuál es mi rentabilidad este año?",
            "Muéstrame un gráfico de ingresos mensuales",
            "¿Cuántas facturas tipo A he emitido este mes?",
            "Calcula mi margen bruto actual"
        ]
    }
