"""
Agente de análisis financiero con LangGraph - Lógica de Movimiento de Cuenta.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from langchain_core.tools import tool
from langchain_openai import AzureChatOpenAI
from langgraph.graph import StateGraph, END
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from src.core.config import settings
from src.models.invoice import Invoice
from src.models.user import User
from src.services.financial_service import FinancialService

logger = logging.getLogger(__name__)


class FinancialAnalysisState:
    """Estado del análisis financiero."""
    query: str
    user_id: int
    owner_id: Optional[int] = None  # CRÍTICO: Para filtros por socio
    analysis_result: Dict[str, Any]
    charts_data: List[Dict[str, Any]]
    fiscal_year: Optional[int]
    error_message: Optional[str]


class FinancialAnalysisAgent:
    """Agente de análisis financiero con herramientas especializadas y lógica de Movimiento de Cuenta."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.financial_service = FinancialService(session)
        self.llm = AzureChatOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_version=settings.OPENAI_API_VERSION,
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            temperature=0.1
        )
        
        # Herramientas del agente
        self.tools = [
            self.calculate_iva_balance,
            self.calculate_balance_general,
            self.calculate_resultado_impuesto_ganancias,
            self.determine_fiscal_year,
            self.calculate_profitability,
            self.get_invoice_summary,
            self.generate_chart_data
        ]
    
    @tool
    async def calculate_iva_balance(self, user_id: int, owner_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Calcula el balance de IVA según la lógica fiscal argentina.
        CRÍTICO: Solo considera facturas tipo "A" para el cálculo de IVA.
        """
        try:
            from datetime import datetime
            
            fecha_desde = datetime.fromisoformat(start_date).date() if start_date else None
            fecha_hasta = datetime.fromisoformat(end_date).date() if end_date else None
            
            return await self.financial_service.get_balance_iva(
                owner=str(owner_id) if owner_id else None,
                fecha_desde=fecha_desde,
                fecha_hasta=fecha_hasta
            )
            
        except Exception as e:
            logger.error(f"Error calculando balance IVA: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def calculate_balance_general(self, user_id: int, owner_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Calcula el Balance General (flujo de caja).
        CRÍTICO: Solo considera facturas donde movimiento_cuenta = True.
        """
        try:
            from datetime import datetime
            
            fecha_desde = datetime.fromisoformat(start_date).date() if start_date else None
            fecha_hasta = datetime.fromisoformat(end_date).date() if end_date else None
            
            return await self.financial_service.get_balance_general(
                owner=str(owner_id) if owner_id else None,
                fecha_desde=fecha_desde,
                fecha_hasta=fecha_hasta
            )
            
        except Exception as e:
            logger.error(f"Error calculando balance general: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def calculate_resultado_impuesto_ganancias(self, user_id: int, owner_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Calcula el Resultado para Impuesto a las Ganancias.
        CRÍTICO: Incluye todas las facturas (A, B, C) para cálculo fiscal completo.
        """
        try:
            query = select(Invoice).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.status == "completed",
                    Invoice.is_deleted == False
                )
            )
            
            # Filtro por propietario si se especifica
            if owner_id:
                query = query.where(Invoice.owner == owner_id)
            
            if start_date:
                query = query.where(Invoice.created_at >= start_date)
            if end_date:
                query = query.where(Invoice.created_at <= end_date)
            
            result = await self.session.execute(query)
            invoices = result.scalars().all()
            
            total_ingresos_gravados = 0.0
            total_egresos_deducibles = 0.0
            total_iva = 0.0
            total_otros_impuestos = 0.0
            
            for invoice in invoices:
                if invoice.extracted_data:
                    invoice_type = invoice.extracted_data.get('invoice_type', '').upper()
                    total = float(invoice.extracted_data.get('total', 0))
                    iva = float(invoice.extracted_data.get('iva', 0))
                    otros_impuestos = float(invoice.otros_impuestos or 0)
                    
                    # Todos los tipos de factura para impuesto a las ganancias
                    if total > 0:  # Ingresos gravados
                        total_ingresos_gravados += total
                    else:  # Egresos deducibles
                        total_egresos_deducibles += abs(total)
                    
                    total_iva += abs(iva)
                    total_otros_impuestos += otros_impuestos
            
            resultado_bruto = total_ingresos_gravados - total_egresos_deducibles
            resultado_neto = resultado_bruto - total_iva - total_otros_impuestos
            
            return {
                "total_ingresos_gravados": total_ingresos_gravados,
                "total_egresos_deducibles": total_egresos_deducibles,
                "total_iva": total_iva,
                "total_otros_impuestos": total_otros_impuestos,
                "resultado_bruto": resultado_bruto,
                "resultado_neto": resultado_neto,
                "periodo": f"{start_date} a {end_date}" if start_date and end_date else "total",
                "owner_filter": owner_id,
                "nota": "Incluye todas las facturas (A, B, C) para cálculo fiscal"
            }
            
        except Exception as e:
            logger.error(f"Error calculando resultado impuesto ganancias: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def determine_fiscal_year(self, user_id: int, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Determina el año fiscal correspondiente.
        CRÍTICO: Implementa lógica de año fiscal de Mayo a Abril.
        """
        try:
            target_date = datetime.now() if not date else datetime.fromisoformat(date)
            
            # CRÍTICO: Año fiscal de Mayo a Abril
            if target_date.month >= 5:  # Mayo a Diciembre
                fiscal_year = target_date.year
                fiscal_start = f"{target_date.year}-05-01"
                fiscal_end = f"{target_date.year + 1}-04-30"
            else:  # Enero a Abril
                fiscal_year = target_date.year - 1
                fiscal_start = f"{target_date.year - 1}-05-01"
                fiscal_end = f"{target_date.year}-04-30"
            
            # Determinar trimestre fiscal
            fiscal_month = target_date.month - 4 if target_date.month >= 5 else target_date.month + 8
            quarter = ((fiscal_month - 1) // 3) + 1
            
            return {
                "fiscal_year": fiscal_year,
                "quarter": quarter,
                "period": f"Q{quarter} {fiscal_year}",
                "fiscal_start": fiscal_start,
                "fiscal_end": fiscal_end,
                "current_date": target_date.strftime("%Y-%m-%d"),
                "nota": "Año fiscal de Mayo a Abril"
            }
            
        except Exception as e:
            logger.error(f"Error determinando año fiscal: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def calculate_profitability(self, user_id: int, owner_id: Optional[int] = None, period: str = "current_quarter") -> Dict[str, Any]:
        """Calcula métricas de rentabilidad y márgenes."""
        try:
            # Determinar fechas según el período
            now = datetime.now()
            if period == "current_quarter":
                quarter = ((now.month - 1) // 3) + 1
                start_month = (quarter - 1) * 3 + 1
                start_date = f"{now.year}-{start_month:02d}-01"
                end_date = f"{now.year}-{min(start_month + 2, 12):02d}-31"
            else:
                start_date = f"{now.year}-01-01"
                end_date = f"{now.year}-12-31"
            
            # Obtener balance general para el período
            balance_data = await self.calculate_balance_general(user_id, owner_id, start_date, end_date)
            
            if "error" in balance_data:
                return balance_data
            
            total_ingresos = balance_data["total_ingresos"]
            total_egresos = balance_data["total_egresos"]
            
            # Calcular métricas
            ganancia_bruta = total_ingresos - total_egresos
            margen_bruto = (ganancia_bruta / total_ingresos * 100) if total_ingresos > 0 else 0
            
            return {
                "periodo": f"{start_date} a {end_date}",
                "total_ingresos": total_ingresos,
                "total_egresos": total_egresos,
                "ganancia_bruta": ganancia_bruta,
                "margen_bruto": round(margen_bruto, 2),
                "owner_filter": owner_id,
                "rentabilidad": "alta" if margen_bruto > 20 else "media" if margen_bruto > 10 else "baja",
                "nota": "Basado en facturas con movimiento_cuenta = True"
            }
            
        except Exception as e:
            logger.error(f"Error calculando rentabilidad: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def get_invoice_summary(self, user_id: int, owner_id: Optional[int] = None, period: str = "current_month") -> Dict[str, Any]:
        """Obtiene resumen de facturas por período."""
        try:
            now = datetime.now()
            if period == "current_month":
                start_date = f"{now.year}-{now.month:02d}-01"
                end_date = f"{now.year}-{now.month:02d}-31"
            elif period == "current_quarter":
                quarter = ((now.month - 1) // 3) + 1
                start_month = (quarter - 1) * 3 + 1
                start_date = f"{now.year}-{start_month:02d}-01"
                end_date = f"{now.year}-{min(start_month + 2, 12):02d}-31"
            else:
                start_date = f"{now.year}-01-01"
                end_date = f"{now.year}-12-31"
            
            query = select(Invoice).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.is_deleted == False
                )
            )
            
            # Filtro por propietario si se especifica
            if owner_id:
                query = query.where(Invoice.owner == owner_id)
            
            result = await self.session.execute(query)
            invoices = result.scalars().all()
            
            # Separar por movimiento de cuenta
            con_movimiento = [i for i in invoices if i.movimiento_cuenta]
            sin_movimiento = [i for i in invoices if not i.movimiento_cuenta]
            
            summary = {
                "total_facturas": len(invoices),
                "con_movimiento_cuenta": len(con_movimiento),
                "sin_movimiento_cuenta": len(sin_movimiento),
                "pendientes": len([i for i in invoices if i.status == "pending"]),
                "procesando": len([i for i in invoices if i.status == "processing"]),
                "completadas": len([i for i in invoices if i.status == "completed"]),
                "con_errores": len([i for i in invoices if i.status == "error"]),
                "periodo": f"{start_date} a {end_date}",
                "owner_filter": owner_id
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error obteniendo resumen: {str(e)}")
            return {"error": str(e)}
    
    @tool
    async def generate_chart_data(self, user_id: int, chart_type: str, owner_id: Optional[int] = None, period: str = "last_6_months") -> Dict[str, Any]:
        """Genera datos para gráficos específicos."""
        try:
            # Calcular fechas según el período
            now = datetime.now()
            if period == "last_6_months":
                start_date = now - timedelta(days=180)
            elif period == "last_year":
                start_date = now - timedelta(days=365)
            else:
                start_date = now - timedelta(days=90)
            
            query = select(Invoice).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.status == "completed",
                    Invoice.created_at >= start_date,
                    Invoice.is_deleted == False
                )
            )
            
            # Filtro por propietario si se especifica
            if owner_id:
                query = query.where(Invoice.owner == owner_id)
            
            result = await self.session.execute(query)
            invoices = result.scalars().all()
            
            if chart_type == "balance_por_socio":
                # Agrupar balances por propietario
                balances_por_socio = {}
                
                for invoice in invoices:
                    if invoice.extracted_data:
                        owner = invoice.owner or "Sin Propietario"
                        if owner not in balances_por_socio:
                            balances_por_socio[owner] = {"ingresos": 0, "egresos": 0}
                        
                        total = float(invoice.extracted_data.get('total', 0))
                        if invoice.movimiento_cuenta:  # Solo facturas con movimiento real
                            if total > 0:
                                balances_por_socio[owner]["ingresos"] += total
                            else:
                                balances_por_socio[owner]["egresos"] += abs(total)
                
                chart_data = [
                    {
                        "socio": owner,
                        "ingresos": data["ingresos"],
                        "egresos": data["egresos"],
                        "balance": data["ingresos"] - data["egresos"]
                    }
                    for owner, data in balances_por_socio.items()
                ]
                
                return {
                    "chart_type": "bar",
                    "title": "Balance por Socio (Solo Movimiento de Cuenta)",
                    "data": chart_data
                }
            
            elif chart_type == "movimiento_cuenta_distribution":
                # Distribución de facturas con/sin movimiento de cuenta
                con_movimiento = len([i for i in invoices if i.movimiento_cuenta])
                sin_movimiento = len([i for i in invoices if not i.movimiento_cuenta])
                
                chart_data = [
                    {"tipo": "Con Movimiento de Cuenta", "cantidad": con_movimiento},
                    {"tipo": "Sin Movimiento de Cuenta", "cantidad": sin_movimiento}
                ]
                
                return {
                    "chart_type": "donut",
                    "title": "Distribución por Movimiento de Cuenta",
                    "data": chart_data
                }
            
            return {"error": "Tipo de gráfico no soportado"}
            
        except Exception as e:
            logger.error(f"Error generando datos de gráfico: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_query(self, query: str, user_id: int, owner_id: Optional[int] = None) -> Dict[str, Any]:
        """Analiza una consulta en lenguaje natural y ejecuta las herramientas necesarias."""
        try:
            # Determinar qué herramientas usar basándose en la consulta
            query_lower = query.lower()
            
            result = {
                "query": query,
                "analysis": "",
                "charts": [],
                "data": {},
                "owner_filter": owner_id
            }
            
            # Análisis de IVA
            if "iva" in query_lower or "balance iva" in query_lower:
                iva_data = await self.calculate_iva_balance(user_id, owner_id)
                result["data"]["iva_balance"] = iva_data
            
            # Análisis de Balance General
            if "balance general" in query_lower or "flujo de caja" in query_lower:
                balance_data = await self.calculate_balance_general(user_id, owner_id)
                result["data"]["balance_general"] = balance_data
            
            # Análisis de Impuesto a las Ganancias
            if "impuesto ganancias" in query_lower or "resultado fiscal" in query_lower:
                ganancias_data = await self.calculate_resultado_impuesto_ganancias(user_id, owner_id)
                result["data"]["resultado_ganancias"] = ganancias_data
            
            # Análisis de rentabilidad
            if "rentabilidad" in query_lower or "margen" in query_lower or "ganancia" in query_lower:
                profitability_data = await self.calculate_profitability(user_id, owner_id)
                result["data"]["profitability"] = profitability_data
            
            # Año fiscal
            if "año fiscal" in query_lower or "fiscal" in query_lower:
                fiscal_data = await self.determine_fiscal_year(user_id)
                result["data"]["fiscal_year"] = fiscal_data
            
            # Resumen de facturas
            if "resumen" in query_lower or "facturas" in query_lower:
                summary_data = await self.get_invoice_summary(user_id, owner_id)
                result["data"]["summary"] = summary_data
            
            # Generar gráficos
            if "gráfico" in query_lower or "chart" in query_lower:
                if "socio" in query_lower:
                    chart_data = await self.generate_chart_data(user_id, "balance_por_socio", owner_id)
                    result["charts"].append(chart_data)
                elif "movimiento" in query_lower:
                    chart_data = await self.generate_chart_data(user_id, "movimiento_cuenta_distribution", owner_id)
                    result["charts"].append(chart_data)
            
            # Generar análisis textual con IA
            analysis_prompt = f"""
            Analiza los siguientes datos financieros de Open Doors y proporciona un análisis conciso en español:
            
            Consulta del usuario: {query}
            Filtro por propietario: {owner_id if owner_id else 'Todos los socios'}
            
            Datos disponibles:
            {json.dumps(result["data"], indent=2, ensure_ascii=False)}
            
            IMPORTANTE: Recuerda que:
            - Balance IVA: Solo considera facturas tipo A
            - Balance General: Solo considera facturas con movimiento_cuenta = True
            - Impuesto Ganancias: Incluye todas las facturas (A, B, C)
            - Año fiscal: Mayo a Abril
            
            Proporciona:
            1. Un resumen ejecutivo
            2. Insights clave sobre la lógica de Movimiento de Cuenta
            3. Recomendaciones fiscales si es apropiado
            """
            
            response = await self.llm.ainvoke(analysis_prompt)
            result["analysis"] = response.content
            
            return result
            
        except Exception as e:
            logger.error(f"Error en análisis: {str(e)}")
            return {
                "query": query,
                "error": str(e),
                "analysis": "Error al procesar la consulta",
                "charts": [],
                "data": {},
                "owner_filter": owner_id
            }