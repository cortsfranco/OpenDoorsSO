"""
Agente de procesamiento de facturas usando LangGraph.
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolExecutor, ToolInvocation
from langchain_core.messages import HumanMessage, AIMessage
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient
from openai import AsyncOpenAI

from src.core.config import settings
from src.models.invoice import Invoice
from src.models.user import User

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InvoiceProcessingState:
    """Estado del procesamiento de facturas."""
    
    def __init__(self):
        self.blob_url: Optional[str] = None
        self.user_id: Optional[int] = None
        self.company_id: Optional[int] = None
        self.invoice_id: Optional[int] = None
        self.status: str = "pending"
        self.extracted_data: Optional[Dict[str, Any]] = None
        self.error_message: Optional[str] = None
        self.messages: list = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el estado a diccionario."""
        return {
            "blob_url": self.blob_url,
            "user_id": self.user_id,
            "company_id": self.company_id,
            "invoice_id": self.invoice_id,
            "status": self.status,
            "extracted_data": self.extracted_data,
            "error_message": self.error_message,
            "messages": self.messages
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InvoiceProcessingState":
        """Crea un estado desde un diccionario."""
        state = cls()
        state.blob_url = data.get("blob_url")
        state.user_id = data.get("user_id")
        state.company_id = data.get("company_id")
        state.invoice_id = data.get("invoice_id")
        state.status = data.get("status", "pending")
        state.extracted_data = data.get("extracted_data")
        state.error_message = data.get("error_message")
        state.messages = data.get("messages", [])
        return state


class InvoiceProcessingAgent:
    """Agente de procesamiento de facturas usando LangGraph."""
    
    def __init__(self, session=None):
        self.session = session
        self.graph = self._build_graph()
        
        # Cliente de Azure Document Intelligence
        self.doc_client = DocumentAnalysisClient(
            endpoint=settings.AZURE_DOC_INTELLIGENCE_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_DOC_INTELLIGENCE_KEY)
        )
        
        # Cliente de Azure OpenAI
        self.openai_client = AsyncOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            base_url=f"{settings.AZURE_OPENAI_ENDPOINT}openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT_NAME}/"
        )
        
        # Cliente de Azure Blob Storage
        self.blob_client = BlobServiceClient(
            account_url=f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
            credential=settings.AZURE_STORAGE_ACCOUNT_KEY
        )
    
    def _build_graph(self) -> StateGraph:
        """Construye el grafo de LangGraph."""
        workflow = StateGraph(InvoiceProcessingState)
        
        # Agregar nodos
        workflow.add_node("start_processing", self._start_processing)
        workflow.add_node("extract_with_doc_intelligence", self._extract_with_doc_intelligence)
        workflow.add_node("validate_and_clean_data", self._validate_and_clean_data)
        workflow.add_node("save_to_database", self._save_to_database)
        workflow.add_node("handle_error", self._handle_error)
        
        # Definir flujo
        workflow.set_entry_point("start_processing")
        
        workflow.add_edge("start_processing", "extract_with_doc_intelligence")
        workflow.add_edge("extract_with_doc_intelligence", "validate_and_clean_data")
        workflow.add_edge("validate_and_clean_data", "save_to_database")
        workflow.add_edge("save_to_database", END)
        
        # Rutas de error
        workflow.add_edge("start_processing", "handle_error")
        workflow.add_edge("extract_with_doc_intelligence", "handle_error")
        workflow.add_edge("validate_and_clean_data", "handle_error")
        workflow.add_edge("handle_error", END)
        
        return workflow.compile()
    
    async def _start_processing(self, state: InvoiceProcessingState) -> InvoiceProcessingState:
        """Nodo inicial: actualiza el estado de la factura a 'processing'."""
        try:
            logger.info(f"Iniciando procesamiento para factura {state.invoice_id}")
            
            # Actualizar estado en la base de datos
            if self.session and state.invoice_id:
                from sqlalchemy import select
                result = await self.session.execute(select(Invoice).where(Invoice.id == state.invoice_id))
                invoice = result.scalar_one_or_none()
                if invoice:
                    invoice.status = "processing"
                    invoice.updated_at = datetime.utcnow()
                    await self.session.commit()
            
            state.status = "processing"
            state.messages.append(AIMessage(content="Procesamiento iniciado"))
            
        except Exception as e:
            logger.error(f"Error en start_processing: {str(e)}")
            state.status = "error"
            state.error_message = str(e)
        
        return state
    
    async def _extract_with_doc_intelligence(self, state: InvoiceProcessingState) -> InvoiceProcessingState:
        """Extrae datos usando Azure Document Intelligence."""
        try:
            logger.info(f"Extrayendo datos de {state.blob_url}")
            
            # Descargar el archivo desde Blob Storage
            blob_name = state.blob_url.split('/')[-1]
            blob_data = self.blob_client.get_blob_client(
                container=settings.AZURE_STORAGE_CONTAINER_NAME,
                blob=blob_name
            ).download_blob().readall()
            
            # Analizar el documento con Document Intelligence
            poller = self.doc_client.begin_analyze_document(
                "prebuilt-invoice", 
                document=blob_data
            )
            result = poller.result()
            
            # Extraer datos estructurados
            extracted_data = {}
            
            for document in result.documents:
                for name, field in document.fields.items():
                    if field.value:
                        extracted_data[name] = field.value
            
            state.extracted_data = extracted_data
            state.messages.append(AIMessage(content="Datos extraídos exitosamente"))
            
        except Exception as e:
            logger.error(f"Error en extract_with_doc_intelligence: {str(e)}")
            state.status = "error"
            state.error_message = str(e)
        
        return state
    
    async def _validate_and_clean_data(self, state: InvoiceProcessingState) -> InvoiceProcessingState:
        """Valida y limpia los datos usando Azure OpenAI."""
        try:
            logger.info("Validando y limpiando datos")
            
            # Preparar prompt para validación
            prompt = f"""
            Eres un experto en facturación argentina. Analiza los siguientes datos extraídos de una factura y:
            
            1. Valida la consistencia de los datos (ej: que la suma de subtotales e impuestos coincida con el total)
            2. Clasifica la factura (Tipo A, B, C)
            3. Formatea los datos en un JSON limpio y estandarizado
            
            Datos extraídos:
            {json.dumps(state.extracted_data, indent=2, ensure_ascii=False)}
            
            Responde SOLO con un JSON válido que contenga:
            - tipo_factura: "A", "B" o "C"
            - proveedor: nombre del proveedor
            - cuit: CUIT del proveedor
            - fecha: fecha de la factura
            - items: array de items con descripción, cantidad, precio_unitario, subtotal
            - subtotal: subtotal sin impuestos
            - iva: monto del IVA
            - total: total de la factura
            - observaciones: cualquier observación importante
            """
            
            # Llamar a Azure OpenAI
            response = await self.openai_client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": "Eres un experto en facturación argentina. Responde siempre con JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                extra_headers={"api-version": settings.OPENAI_API_VERSION}
            )
            
            # Parsear respuesta JSON
            cleaned_data = json.loads(response.choices[0].message.content)
            state.extracted_data = cleaned_data
            state.messages.append(AIMessage(content="Datos validados y limpiados"))
            
        except Exception as e:
            logger.error(f"Error en validate_and_clean_data: {str(e)}")
            state.status = "error"
            state.error_message = str(e)
        
        return state
    
    async def _save_to_database(self, state: InvoiceProcessingState) -> InvoiceProcessingState:
        """Guarda los datos procesados en la base de datos."""
        try:
            logger.info("Guardando datos en la base de datos")
            
            if self.session and state.invoice_id:
                from sqlalchemy import select
                result = await self.session.execute(select(Invoice).where(Invoice.id == state.invoice_id))
                invoice = result.scalar_one_or_none()
                if invoice:
                    invoice.extracted_data = state.extracted_data
                    invoice.status = "completed"
                    invoice.updated_at = datetime.utcnow()
                    await self.session.commit()
            
            state.status = "completed"
            state.messages.append(AIMessage(content="Datos guardados exitosamente"))
            
        except Exception as e:
            logger.error(f"Error en save_to_database: {str(e)}")
            state.status = "error"
            state.error_message = str(e)
        
        return state
    
    async def _handle_error(self, state: InvoiceProcessingState) -> InvoiceProcessingState:
        """Maneja errores en el procesamiento."""
        logger.error(f"Error en procesamiento: {state.error_message}")
        
        if self.session and state.invoice_id:
            try:
                from sqlalchemy import select
                result = await self.session.execute(select(Invoice).where(Invoice.id == state.invoice_id))
                invoice = result.scalar_one_or_none()
                if invoice:
                    invoice.status = "error"
                    invoice.extracted_data = {"error": state.error_message}
                    invoice.updated_at = datetime.utcnow()
                    await self.session.commit()
            except Exception as e:
                logger.error(f"Error al actualizar estado de error: {str(e)}")
        
        state.status = "error"
        state.messages.append(AIMessage(content=f"Error: {state.error_message}"))
        
        return state
    
    async def process_invoice_from_url(self, blob_url: str, user_id: int, company_id: int = None, invoice_id: int = None) -> Dict[str, Any]:
        """Procesa una factura desde su URL en Blob Storage."""
        try:
            # Crear estado inicial
            initial_state = InvoiceProcessingState()
            initial_state.blob_url = blob_url
            initial_state.user_id = user_id
            initial_state.company_id = company_id
            initial_state.invoice_id = invoice_id
            
            # Ejecutar el grafo
            result = await self.graph.ainvoke(initial_state.to_dict())
            
            return result
            
        except Exception as e:
            logger.error(f"Error en process_invoice_from_url: {str(e)}")
            return {
                "status": "error",
                "error_message": str(e)
            }