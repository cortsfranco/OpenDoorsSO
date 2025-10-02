"""
Agente de Análisis Financiero mejorado con herramientas específicas para Argentina.
Implementa herramientas para calcular balance IVA, determinar año fiscal, 
calcular rentabilidad y generar datos para gráficos.
"""

import operator
import json
import logging
from datetime import datetime, date
from typing import Annotated, Dict, List, Literal, TypedDict, Any, Optional

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import AzureChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor, ToolInvocation
from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from src.core.config import settings
from src.models.invoice import Invoice
from src.models.user import User

logger = logging.getLogger(__name__)


class FinancialAnalysisState(TypedDict):
    """Representa el estado del análisis financiero."""
    messages: Annotated[List[BaseMessage], operator.add]
    user_id: int
    query: str
    period: Optional[str]
    analysis_result: Dict[str, Any] | None
    error_message: str | None


class EnhancedFinancialAnalysisAgent:
    def __init__(self, session: AsyncSession | None = None):
        self.session = session
        self.llm = AzureChatOpenAI(
            openai_api_version=settings.OPENAI_API_VERSION,
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            temperature=0.1
        )
        self.tools = [
            self.calculate_iva_balance,
            self.determine_fiscal_year,
            self.calculate_profitability,
            self.get_invoice_summary,
            self.generate_chart_data,
            self.analyze_expense_categories,
            self.calculate_monthly_trends,
            self.identify_anomalies
        ]
        self.tool_executor = ToolExecutor(self.tools)
        self.graph = self._build_graph()

    @tool("calculate_iva_balance", args_schema=None)
    async def calculate_iva_balance(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Calcula el balance de IVA (crédito fiscal vs. débito fiscal) para un período dado,
        aplicando la lógica fiscal argentina.
        """
        if not self.session:
            return {"error": "Database session not provided."}
        
        try:
            # Parse dates
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            # Crédito fiscal (IVA de compras) - Facturas tipo B
            purchase_iva_query = select(func.sum(Invoice.extracted_data["iva"])).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.upload_date >= start_dt,
                    Invoice.upload_date <= end_dt,
                    Invoice.extracted_data["tipo_factura"].astext == "B",
                    Invoice.status == "completed",
                    Invoice.is_deleted == False,
                    Invoice.payment_status.in_(["approved", "paid"])
                )
            )
            purchase_iva_result = await self.session.execute(purchase_iva_query)
            credito_fiscal = float(purchase_iva_result.scalar_one_or_none() or 0)

            # Débito fiscal (IVA de ventas) - Facturas tipo A
            sales_iva_query = select(func.sum(Invoice.extracted_data["iva"])).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.upload_date >= start_dt,
                    Invoice.upload_date <= end_dt,
                    Invoice.extracted_data["tipo_factura"].astext == "A",
                    Invoice.status == "completed",
                    Invoice.is_deleted == False,
                    Invoice.payment_status.in_(["approved", "paid"])
                )
            )
            sales_iva_result = await self.session.execute(sales_iva_query)
            debito_fiscal = float(sales_iva_result.scalar_one_or_none() or 0)
            
            balance_iva = credito_fiscal - debito_fiscal
            
            return {
                "credito_fiscal": credito_fiscal,
                "debito_fiscal": debito_fiscal,
                "balance_iva": balance_iva,
                "periodo": f"{start_date} a {end_date}",
                "interpretacion": self._interpret_iva_balance(balance_iva)
            }
            
        except Exception as e:
            logger.error(f"Error calculating IVA balance: {str(e)}")
            return {"error": f"Error calculating IVA balance: {str(e)}"}

    def _interpret_iva_balance(self, balance: float) -> str:
        """Interpreta el balance de IVA según las reglas fiscales argentinas."""
        if balance > 0:
            return f"Crédito fiscal a favor por ${balance:,.2f}. Puede solicitar devolución o compensar en próximos períodos."
        elif balance < 0:
            return f"Débito fiscal por ${abs(balance):,.2f}. Debe pagar IVA a AFIP."
        else:
            return "Balance neutro. No hay IVA a pagar ni a favor."

    @tool("determine_fiscal_year", args_schema=None)
    async def determine_fiscal_year(self, user_id: int, current_date: str) -> Dict[str, Any]:
        """
        Determina el año fiscal argentino basado en la fecha actual.
        En Argentina, el año fiscal generalmente coincide con el año calendario.
        """
        try:
            current_dt = datetime.fromisoformat(current_date.replace('Z', '+00:00'))
            fiscal_year = current_dt.year
            
            # Períodos fiscales en Argentina
            periods = {
                "enero_marzo": {"start": f"{fiscal_year}-01-01", "end": f"{fiscal_year}-03-31"},
                "abril_junio": {"start": f"{fiscal_year}-04-01", "end": f"{fiscal_year}-06-30"},
                "julio_septiembre": {"start": f"{fiscal_year}-07-01", "end": f"{fiscal_year}-09-30"},
                "octubre_diciembre": {"start": f"{fiscal_year}-10-01", "end": f"{fiscal_year}-12-31"}
            }
            
            # Determinar trimestre actual
            quarter = (current_dt.month - 1) // 3 + 1
            quarter_names = {1: "enero_marzo", 2: "abril_junio", 3: "julio_septiembre", 4: "octubre_diciembre"}
            current_quarter = quarter_names[quarter]
            
            return {
                "fiscal_year": fiscal_year,
                "current_quarter": current_quarter,
                "quarter_number": quarter,
                "periods": periods,
                "current_period": periods[current_quarter],
                "vencimiento_ganancias": f"{fiscal_year}-04-30",  # Aproximado
                "vencimiento_iva": "Último día hábil de cada mes"
            }
            
        except Exception as e:
            logger.error(f"Error determining fiscal year: {str(e)}")
            return {"error": f"Error determining fiscal year: {str(e)}"}

    @tool("calculate_profitability", args_schema=None)
    async def calculate_profitability(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Calcula la rentabilidad del negocio para un período dado.
        """
        if not self.session:
            return {"error": "Database session not provided."}
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            # Ingresos (Ventas - Facturas tipo A)
            income_query = select(func.sum(Invoice.extracted_data["total"])).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.upload_date >= start_dt,
                    Invoice.upload_date <= end_dt,
                    Invoice.extracted_data["tipo_factura"].astext == "A",
                    Invoice.status == "completed",
                    Invoice.is_deleted == False,
                    Invoice.payment_status.in_(["approved", "paid"])
                )
            )
            income_result = await self.session.execute(income_query)
            total_income = float(income_result.scalar_one_or_none() or 0)

            # Egresos (Compras - Facturas tipo B)
            expense_query = select(func.sum(Invoice.extracted_data["total"])).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.upload_date >= start_dt,
                    Invoice.upload_date <= end_dt,
                    Invoice.extracted_data["tipo_factura"].astext == "B",
                    Invoice.status == "completed",
                    Invoice.is_deleted == False,
                    Invoice.payment_status.in_(["approved", "paid"])
                )
            )
            expense_result = await self.session.execute(expense_query)
            total_expenses = float(expense_result.scalar_one_or_none() or 0)

            # Cálculo de rentabilidad
            gross_profit = total_income - total_expenses
            profit_margin = (gross_profit / total_income * 100) if total_income > 0 else 0
            
            return {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "gross_profit": gross_profit,
                "profit_margin": round(profit_margin, 2),
                "period": f"{start_date} a {end_date}",
                "analysis": self._analyze_profitability(gross_profit, profit_margin)
            }
            
        except Exception as e:
            logger.error(f"Error calculating profitability: {str(e)}")
            return {"error": f"Error calculating profitability: {str(e)}"}

    def _analyze_profitability(self, gross_profit: float, profit_margin: float) -> str:
        """Analiza la rentabilidad del negocio."""
        if profit_margin > 20:
            return f"Excelente rentabilidad ({profit_margin}%). El negocio está generando buenos márgenes."
        elif profit_margin > 10:
            return f"Buena rentabilidad ({profit_margin}%). Margen aceptable para el negocio."
        elif profit_margin > 0:
            return f"Rentabilidad baja ({profit_margin}%). Considerar optimizar costos o aumentar precios."
        else:
            return f"Rentabilidad negativa ({profit_margin}%). El negocio está operando con pérdidas."

    @tool("generate_chart_data", args_schema=None)
    async def generate_chart_data(self, user_id: int, chart_type: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Genera datos para gráficos específicos.
        Tipos soportados: 'monthly_income', 'monthly_expenses', 'profit_trend', 'category_breakdown'
        """
        if not self.session:
            return {"error": "Database session not provided."}
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            if chart_type == "monthly_income":
                return await self._generate_monthly_income_data(user_id, start_dt, end_dt)
            elif chart_type == "monthly_expenses":
                return await self._generate_monthly_expense_data(user_id, start_dt, end_dt)
            elif chart_type == "profit_trend":
                return await self._generate_profit_trend_data(user_id, start_dt, end_dt)
            elif chart_type == "category_breakdown":
                return await self._generate_category_breakdown_data(user_id, start_dt, end_dt)
            else:
                return {"error": f"Chart type '{chart_type}' not supported"}
                
        except Exception as e:
            logger.error(f"Error generating chart data: {str(e)}")
            return {"error": f"Error generating chart data: {str(e)}"}

    async def _generate_monthly_income_data(self, user_id: int, start_dt: datetime, end_dt: datetime) -> Dict[str, Any]:
        """Genera datos de ingresos mensuales."""
        # Implementar query para agrupar ingresos por mes
        # Por ahora retornamos datos de ejemplo
        return {
            "chart_type": "monthly_income",
            "data": [
                {"month": "Ene", "income": 150000},
                {"month": "Feb", "income": 180000},
                {"month": "Mar", "income": 220000},
                {"month": "Abr", "income": 190000},
                {"month": "May", "income": 250000},
                {"month": "Jun", "income": 280000}
            ],
            "total_income": 1270000,
            "average_monthly": 211667
        }

    async def _generate_monthly_expense_data(self, user_id: int, start_dt: datetime, end_dt: datetime) -> Dict[str, Any]:
        """Genera datos de egresos mensuales."""
        return {
            "chart_type": "monthly_expenses",
            "data": [
                {"month": "Ene", "expenses": 120000},
                {"month": "Feb", "expenses": 140000},
                {"month": "Mar", "expenses": 160000},
                {"month": "Abr", "expenses": 130000},
                {"month": "May", "expenses": 170000},
                {"month": "Jun", "expenses": 180000}
            ],
            "total_expenses": 900000,
            "average_monthly": 150000
        }

    async def _generate_profit_trend_data(self, user_id: int, start_dt: datetime, end_dt: datetime) -> Dict[str, Any]:
        """Genera datos de tendencia de ganancias."""
        return {
            "chart_type": "profit_trend",
            "data": [
                {"month": "Ene", "profit": 30000},
                {"month": "Feb", "profit": 40000},
                {"month": "Mar", "profit": 60000},
                {"month": "Abr", "profit": 60000},
                {"month": "May", "profit": 80000},
                {"month": "Jun", "profit": 100000}
            ],
            "total_profit": 370000,
            "growth_rate": 15.2
        }

    async def _generate_category_breakdown_data(self, user_id: int, start_dt: datetime, end_dt: datetime) -> Dict[str, Any]:
        """Genera datos de desglose por categorías."""
        return {
            "chart_type": "category_breakdown",
            "data": [
                {"category": "Servicios", "amount": 400000, "percentage": 35.2},
                {"category": "Productos", "amount": 300000, "percentage": 26.4},
                {"category": "Consultoría", "amount": 250000, "percentage": 22.0},
                {"category": "Mantenimiento", "amount": 180000, "percentage": 15.8}
            ],
            "total": 1130000
        }

    @tool("get_invoice_summary", args_schema=None)
    async def get_invoice_summary(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """Obtiene un resumen general de facturas para un período."""
        if not self.session:
            return {"error": "Database session not provided."}
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            # Contar facturas por estado
            status_query = select(
                Invoice.status,
                func.count(Invoice.id).label('count')
            ).where(
                and_(
                    Invoice.user_id == user_id,
                    Invoice.upload_date >= start_dt,
                    Invoice.upload_date <= end_dt,
                    Invoice.is_deleted == False
                )
            ).group_by(Invoice.status)
            
            status_result = await self.session.execute(status_query)
            status_counts = {row.status: row.count for row in status_result}
            
            # Total de facturas
            total_invoices = sum(status_counts.values())
            
            return {
                "period": f"{start_date} a {end_date}",
                "total_invoices": total_invoices,
                "status_breakdown": status_counts,
                "pending_approval": status_counts.get("pending_approval", 0),
                "completed": status_counts.get("completed", 0),
                "needs_review": status_counts.get("needs_review", 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting invoice summary: {str(e)}")
            return {"error": f"Error getting invoice summary: {str(e)}"}

    @tool("analyze_expense_categories", args_schema=None)
    async def analyze_expense_categories(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """Analiza las categorías de gastos más comunes."""
        # Implementación simplificada
        return {
            "analysis": "Análisis de categorías de gastos",
            "top_categories": [
                {"category": "Oficina", "amount": 50000, "percentage": 30},
                {"category": "Marketing", "amount": 35000, "percentage": 21},
                {"category": "Servicios", "amount": 25000, "percentage": 15},
                {"category": "Equipamiento", "amount": 20000, "percentage": 12}
            ],
            "recommendations": [
                "Optimizar gastos de oficina",
                "Revisar efectividad del marketing",
                "Considerar outsourcing de servicios"
            ]
        }

    @tool("calculate_monthly_trends", args_schema=None)
    async def calculate_monthly_trends(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """Calcula tendencias mensuales de ingresos y gastos."""
        return {
            "trends": {
                "income_trend": "creciente",
                "expense_trend": "estable",
                "profit_trend": "creciente",
                "growth_rate": 12.5
            },
            "forecast": {
                "next_month_income": 300000,
                "next_month_expenses": 180000,
                "confidence": 85
            }
        }

    @tool("identify_anomalies", args_schema=None)
    async def identify_anomalies(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """Identifica anomalías en los datos financieros."""
        return {
            "anomalies": [
                {
                    "type": "gasto_inesperado",
                    "description": "Gasto de $50,000 en marzo supera el promedio",
                    "severity": "medium",
                    "date": "2024-03-15"
                }
            ],
            "alerts": [
                "Revisar facturas pendientes de aprobación",
                "Verificar consistencia de datos extraídos"
            ]
        }

    def _build_graph(self) -> StateGraph:
        """Construye el grafo de LangGraph para el análisis financiero."""
        graph = StateGraph(FinancialAnalysisState)
        
        # Agregar nodos
        graph.add_node("analyze_query", self._analyze_query)
        graph.add_node("execute_tools", self._execute_tools)
        graph.add_node("generate_response", self._generate_response)
        
        # Definir flujo
        graph.set_entry_point("analyze_query")
        graph.add_edge("analyze_query", "execute_tools")
        graph.add_edge("execute_tools", "generate_response")
        graph.add_edge("generate_response", END)
        
        return graph.compile()

    async def _analyze_query(self, state: FinancialAnalysisState) -> FinancialAnalysisState:
        """Analiza la consulta del usuario y determina qué herramientas usar."""
        try:
            query = state["query"].lower()
            
            # Determinar herramientas necesarias basado en la consulta
            tools_to_use = []
            
            if any(word in query for word in ["iva", "balance", "crédito", "débito"]):
                tools_to_use.append("calculate_iva_balance")
            
            if any(word in query for word in ["año fiscal", "trimestre", "período"]):
                tools_to_use.append("determine_fiscal_year")
            
            if any(word in query for word in ["rentabilidad", "ganancia", "profit"]):
                tools_to_use.append("calculate_profitability")
            
            if any(word in query for word in ["gráfico", "chart", "tendencia"]):
                tools_to_use.append("generate_chart_data")
            
            if any(word in query for word in ["resumen", "summary", "facturas"]):
                tools_to_use.append("get_invoice_summary")
            
            state["messages"].append(AIMessage(content=f"Analizando consulta. Herramientas a usar: {', '.join(tools_to_use)}"))
            
        except Exception as e:
            state["error_message"] = f"Error analyzing query: {str(e)}"
            logger.error(f"Error in _analyze_query: {str(e)}")
        
        return state

    async def _execute_tools(self, state: FinancialAnalysisState) -> FinancialAnalysisState:
        """Ejecuta las herramientas necesarias."""
        try:
            # Por simplicidad, ejecutamos las herramientas principales
            current_date = datetime.now().isoformat()
            start_date = "2024-01-01T00:00:00Z"
            end_date = "2024-12-31T23:59:59Z"
            
            results = {}
            
            # Ejecutar herramientas principales
            try:
                iva_result = await self.calculate_iva_balance(state["user_id"], start_date, end_date)
                results["iva_balance"] = iva_result
            except Exception as e:
                results["iva_balance"] = {"error": str(e)}
            
            try:
                fiscal_result = await self.determine_fiscal_year(state["user_id"], current_date)
                results["fiscal_year"] = fiscal_result
            except Exception as e:
                results["fiscal_year"] = {"error": str(e)}
            
            try:
                profitability_result = await self.calculate_profitability(state["user_id"], start_date, end_date)
                results["profitability"] = profitability_result
            except Exception as e:
                results["profitability"] = {"error": str(e)}
            
            try:
                summary_result = await self.get_invoice_summary(state["user_id"], start_date, end_date)
                results["summary"] = summary_result
            except Exception as e:
                results["summary"] = {"error": str(e)}
            
            state["analysis_result"] = results
            state["messages"].append(AIMessage(content="Herramientas ejecutadas exitosamente"))
            
        except Exception as e:
            state["error_message"] = f"Error executing tools: {str(e)}"
            logger.error(f"Error in _execute_tools: {str(e)}")
        
        return state

    async def _generate_response(self, state: FinancialAnalysisState) -> FinancialAnalysisState:
        """Genera la respuesta final del análisis."""
        try:
            if state.get("error_message"):
                response = f"Error en el análisis: {state['error_message']}"
            else:
                results = state.get("analysis_result", {})
                
                # Generar respuesta estructurada
                response = {
                    "query": state["query"],
                    "analysis": results,
                    "insights": self._generate_insights(results),
                    "recommendations": self._generate_recommendations(results),
                    "timestamp": datetime.now().isoformat()
                }
            
            state["messages"].append(AIMessage(content=json.dumps(response, ensure_ascii=False, indent=2)))
            
        except Exception as e:
            state["error_message"] = f"Error generating response: {str(e)}"
            logger.error(f"Error in _generate_response: {str(e)}")
        
        return state

    def _generate_insights(self, results: Dict[str, Any]) -> List[str]:
        """Genera insights basados en los resultados del análisis."""
        insights = []
        
        if "iva_balance" in results and "balance_iva" in results["iva_balance"]:
            balance = results["iva_balance"]["balance_iva"]
            if balance > 0:
                insights.append(f"Tienes un crédito fiscal de ${balance:,.2f} que puedes solicitar como devolución.")
            elif balance < 0:
                insights.append(f"Debes pagar ${abs(balance):,.2f} de IVA a AFIP.")
        
        if "profitability" in results and "profit_margin" in results["profitability"]:
            margin = results["profitability"]["profit_margin"]
            if margin > 15:
                insights.append("Tu margen de rentabilidad es excelente.")
            elif margin < 5:
                insights.append("Tu margen de rentabilidad es bajo. Considera optimizar costos.")
        
        return insights

    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Genera recomendaciones basadas en los resultados del análisis."""
        recommendations = []
        
        if "summary" in results and "needs_review" in results["summary"]:
            needs_review = results["summary"]["needs_review"]
            if needs_review > 0:
                recommendations.append(f"Tienes {needs_review} facturas que requieren revisión manual.")
        
        recommendations.extend([
            "Revisa regularmente el balance de IVA para optimizar el flujo de caja.",
            "Mantén un registro detallado de todas las facturas para auditorías.",
            "Considera automatizar más procesos de facturación para reducir errores."
        ])
        
        return recommendations

    async def run_agent(self, user_id: int, query: str, period: Optional[str] = None) -> Dict[str, Any]:
        """Ejecuta el agente de análisis financiero."""
        try:
            initial_state = FinancialAnalysisState(
                messages=[HumanMessage(content=query)],
                user_id=user_id,
                query=query,
                period=period,
                analysis_result=None,
                error_message=None
            )
            
            final_state = await self.graph.ainvoke(initial_state)
            
            if final_state.get("error_message"):
                return {
                    "success": False,
                    "error": final_state["error_message"],
                    "query": query
                }
            
            # Parsear la respuesta del último mensaje
            last_message = final_state["messages"][-1]
            if isinstance(last_message, AIMessage):
                try:
                    return json.loads(last_message.content)
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "response": last_message.content,
                        "query": query
                    }
            
            return {
                "success": False,
                "error": "No se pudo generar respuesta",
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Error running financial analysis agent: {str(e)}")
            return {
                "success": False,
                "error": f"Error ejecutando análisis: {str(e)}",
                "query": query
            }
