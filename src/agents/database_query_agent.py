"""
Agente para consultas de base de datos en lenguaje natural.
Permite a usuarios no técnicos consultar datos financieros usando lenguaje natural.
"""

import json
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_core.tools import BaseTool, tool
from langchain_openai import ChatOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.base_agent import BaseAgent, AgentState
from src.core.config import settings
from src.core.database import get_session


class DatabaseQueryAgent(BaseAgent):
    """
    Agente especializado en consultas de base de datos en lenguaje natural.
    """
    
    def __init__(self):
        super().__init__(
            name="database_query_agent",
            description="Permite consultar datos financieros usando lenguaje natural"
        )
        self.llm = None
    
    def _get_llm(self):
        """Obtiene el modelo de lenguaje."""
        if not self.llm:
            self.llm = ChatOpenAI(
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                api_key=settings.AZURE_OPENAI_API_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.OPENAI_API_VERSION,
                temperature=0.1
            )
        return self.llm
    
    def get_tools(self) -> List[BaseTool]:
        """Obtiene las herramientas del agente."""
        return [
            self._get_database_schema_tool(),
            self._generate_sql_query_tool(),
            self._execute_sql_query_tool(),
            self._synthesize_response_tool()
        ]
    
    @tool
    def _get_database_schema_tool(self) -> str:
        """
        Obtiene el esquema de la base de datos.
        
        Returns:
            Esquema de la base de datos en formato JSON
        """
        schema = {
            "tables": {
                "invoices": {
                    "description": "Tabla de facturas emitidas",
                    "columns": {
                        "id": "ID único de la factura",
                        "invoice_number": "Número de factura",
                        "invoice_type": "Tipo de factura (invoice_a, invoice_b, invoice_c, credit_note, debit_note)",
                        "issue_date": "Fecha de emisión",
                        "due_date": "Fecha de vencimiento",
                        "subtotal": "Subtotal de la factura",
                        "tax_amount": "Monto de impuestos",
                        "total_amount": "Total de la factura",
                        "status": "Estado de la factura (draft, pending, approved, sent, paid, cancelled)",
                        "notes": "Notas adicionales",
                        "company_id": "ID de la empresa",
                        "client_id": "ID del cliente",
                        "created_by_user_id": "ID del usuario que creó la factura",
                        "created_at": "Fecha de creación",
                        "updated_at": "Fecha de última actualización"
                    }
                },
                "clients": {
                    "description": "Tabla de clientes",
                    "columns": {
                        "id": "ID único del cliente",
                        "name": "Nombre del cliente",
                        "tax_id": "CUIT/CUIL del cliente",
                        "email": "Email del cliente",
                        "phone": "Teléfono del cliente",
                        "address": "Dirección del cliente",
                        "is_active": "Si el cliente está activo",
                        "company_id": "ID de la empresa",
                        "created_at": "Fecha de creación",
                        "updated_at": "Fecha de última actualización"
                    }
                },
                "companies": {
                    "description": "Tabla de empresas",
                    "columns": {
                        "id": "ID único de la empresa",
                        "name": "Nombre de la empresa",
                        "tax_id": "CUIT/CUIL de la empresa",
                        "address": "Dirección de la empresa",
                        "phone": "Teléfono de la empresa",
                        "email": "Email de la empresa",
                        "is_active": "Si la empresa está activa",
                        "created_at": "Fecha de creación",
                        "updated_at": "Fecha de última actualización"
                    }
                },
                "users": {
                    "description": "Tabla de usuarios del sistema",
                    "columns": {
                        "id": "ID único del usuario",
                        "email": "Email del usuario",
                        "full_name": "Nombre completo del usuario",
                        "role": "Rol del usuario (admin, finance_user, manager, employee)",
                        "is_active": "Si el usuario está activo",
                        "company_id": "ID de la empresa a la que pertenece",
                        "created_at": "Fecha de creación",
                        "updated_at": "Fecha de última actualización"
                    }
                }
            },
            "relationships": {
                "invoices.client_id": "clients.id",
                "invoices.company_id": "companies.id",
                "invoices.created_by_user_id": "users.id",
                "clients.company_id": "companies.id",
                "users.company_id": "companies.id"
            }
        }
        
        return f"Esquema de la base de datos: {json.dumps(schema, indent=2)}"
    
    @tool
    def _generate_sql_query_tool(self, user_query: str, schema: str) -> str:
        """
        Genera una consulta SQL a partir de una consulta en lenguaje natural.
        
        Args:
            user_query: Consulta del usuario en lenguaje natural
            schema: Esquema de la base de datos
            
        Returns:
            Consulta SQL generada
        """
        try:
            llm = self._get_llm()
            
            prompt = f"""
            Eres un experto en SQL y bases de datos. Genera una consulta SQL PostgreSQL 
            basándote en la consulta del usuario y el esquema de la base de datos.
            
            Consulta del usuario: {user_query}
            
            Esquema de la base de datos:
            {schema}
            
            Reglas importantes:
            1. Usa solo las tablas y columnas disponibles en el esquema
            2. Incluye JOINs cuando sea necesario para relacionar tablas
            3. Usa parámetros para company_id (ejemplo: WHERE company_id = :company_id)
            4. Para fechas, usa funciones de PostgreSQL como DATE_TRUNC, EXTRACT, etc.
            5. Para totales y sumas, usa funciones agregadas como SUM, COUNT, AVG
            6. Incluye LIMIT cuando sea apropiado para evitar resultados muy grandes
            7. Usa nombres de columnas descriptivos en SELECT cuando sea posible
            
            Ejemplos de consultas comunes:
            - "facturas del mes pasado": SELECT * FROM invoices WHERE DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND company_id = :company_id
            - "total de facturas por cliente": SELECT c.name, SUM(i.total_amount) FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.company_id = :company_id GROUP BY c.id, c.name
            - "facturas vencidas": SELECT * FROM invoices WHERE due_date < CURRENT_DATE AND status IN ('pending', 'sent') AND company_id = :company_id
            
            Responde SOLO con la consulta SQL, sin explicaciones adicionales.
            """
            
            response = llm.invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            return f"Error al generar consulta SQL: {str(e)}"
    
    @tool
    def _execute_sql_query_tool(self, sql_query: str, company_id: int) -> str:
        """
        Ejecuta una consulta SQL de forma segura.
        
        Args:
            sql_query: Consulta SQL a ejecutar
            company_id: ID de la empresa para filtrar resultados
            
        Returns:
            Resultados de la consulta en formato JSON
        """
        try:
            # Nota: En una implementación real, esto debería usar una sesión de base de datos
            # y validaciones de seguridad más estrictas
            
            # Por ahora, retornamos un mensaje indicando que se necesita implementación
            return f"Consulta SQL generada: {sql_query}\n[Nota: La ejecución de consultas SQL requiere implementación con sesión de base de datos]"
            
        except Exception as e:
            return f"Error al ejecutar consulta SQL: {str(e)}"
    
    @tool
    def _synthesize_response_tool(self, query_results: str, original_query: str) -> str:
        """
        Sintetiza una respuesta legible a partir de los resultados de la consulta.
        
        Args:
            query_results: Resultados de la consulta SQL
            original_query: Consulta original del usuario
            
        Returns:
            Respuesta sintetizada en lenguaje natural
        """
        try:
            llm = self._get_llm()
            
            prompt = f"""
            Eres un asistente que ayuda a interpretar resultados de consultas de base de datos.
            
            Consulta original del usuario: {original_query}
            
            Resultados de la consulta:
            {query_results}
            
            Proporciona una respuesta clara y útil en español que responda a la consulta del usuario.
            Si hay datos numéricos, preséntalos de forma clara.
            Si hay múltiples registros, proporciona un resumen cuando sea apropiado.
            Si no hay resultados, explica qué significa eso.
            
            Mantén la respuesta concisa pero informativa.
            """
            
            response = llm.invoke(prompt)
            return response.content
            
        except Exception as e:
            return f"Error al sintetizar respuesta: {str(e)}"
    
    def build_graph(self) -> StateGraph:
        """Construye el grafo de consultas de base de datos."""
        
        def get_schema_node(state: Dict[str, Any]) -> Dict[str, Any]:
            """Nodo para obtener el esquema de la base de datos."""
            schema = self._get_database_schema_tool()
            
            return {
                "schema": schema,
                "messages": state.get("messages", []) + [
                    {"role": "assistant", "content": "Esquema de base de datos obtenido"}
                ]
            }
        
        def generate_sql_node(state: Dict[str, Any]) -> Dict[str, Any]:
            """Nodo para generar la consulta SQL."""
            user_query = state.get("user_input")
            schema = state.get("schema")
            
            if not user_query or not schema:
                return {"error": "Falta información necesaria para generar la consulta SQL"}
            
            sql_query = self._generate_sql_query_tool(user_query, schema)
            
            return {
                "sql_query": sql_query,
                "messages": state.get("messages", []) + [
                    {"role": "assistant", "content": f"Consulta SQL generada: {sql_query}"}
                ]
            }
        
        def execute_query_node(state: Dict[str, Any]) -> Dict[str, Any]:
            """Nodo para ejecutar la consulta SQL."""
            sql_query = state.get("sql_query")
            company_id = state.get("context", {}).get("company_id")
            
            if not sql_query:
                return {"error": "No hay consulta SQL para ejecutar"}
            
            if not company_id:
                return {"error": "Se requiere company_id para ejecutar la consulta"}
            
            query_results = self._execute_sql_query_tool(sql_query, company_id)
            
            return {
                "query_results": query_results,
                "messages": state.get("messages", []) + [
                    {"role": "assistant", "content": "Consulta ejecutada"}
                ]
            }
        
        def synthesize_response_node(state: Dict[str, Any]) -> Dict[str, Any]:
            """Nodo para sintetizar la respuesta final."""
            query_results = state.get("query_results")
            user_query = state.get("user_input")
            
            if not query_results or not user_query:
                return {"error": "Falta información para sintetizar la respuesta"}
            
            synthesized_response = self._synthesize_response_tool(query_results, user_query)
            
            return {
                "result": {"response": synthesized_response},
                "messages": state.get("messages", []) + [
                    {"role": "assistant", "content": synthesized_response}
                ]
            }
        
        # Crear el grafo
        graph = StateGraph(AgentState)
        
        # Agregar nodos
        graph.add_node("get_schema", get_schema_node)
        graph.add_node("generate_sql", generate_sql_node)
        graph.add_node("execute_query", execute_query_node)
        graph.add_node("synthesize_response", synthesize_response_node)
        
        # Definir el flujo
        graph.set_entry_point("get_schema")
        graph.add_edge("get_schema", "generate_sql")
        graph.add_edge("generate_sql", "execute_query")
        graph.add_edge("execute_query", "synthesize_response")
        graph.add_edge("synthesize_response", END)
        
        return graph.compile()
