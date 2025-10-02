"""
Agente mejorado de procesamiento de facturas con validación inteligente.
"""

import json
import logging
import re
from typing import Dict, Any, Optional
from datetime import datetime

from langchain_core.messages import HumanMessage, AIMessage
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient
from openai import AsyncOpenAI

from src.core.config import settings

logger = logging.getLogger(__name__)


class EnhancedInvoiceProcessingAgent:
    """Agente mejorado de procesamiento de facturas con validación inteligente."""
    
    def __init__(self, session=None):
        self.session = session
        
        # Inicialización lazy de clientes Azure (solo si hay credenciales)
        self.doc_client = None
        self.openai_client = None
        self.blob_client = None
        
        # Solo inicializar si hay credenciales configuradas
        if settings.AZURE_DOC_INTELLIGENCE_ENDPOINT and settings.AZURE_DOC_INTELLIGENCE_KEY:
            self.doc_client = DocumentAnalysisClient(
                endpoint=settings.AZURE_DOC_INTELLIGENCE_ENDPOINT,
                credential=AzureKeyCredential(settings.AZURE_DOC_INTELLIGENCE_KEY)
            )
        
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.openai_client = AsyncOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                base_url=f"{settings.AZURE_OPENAI_ENDPOINT}openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT_NAME}/"
            )
        
        if settings.AZURE_STORAGE_ACCOUNT_NAME and settings.AZURE_STORAGE_ACCOUNT_KEY:
            self.blob_client = BlobServiceClient(
                account_url=f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
                credential=settings.AZURE_STORAGE_ACCOUNT_KEY
            )
    
    async def extract_with_doc_intelligence(self, blob_url: str) -> Dict[str, Any]:
        """Extrae datos usando Azure Document Intelligence con campos específicos."""
        try:
            logger.info("Extrayendo datos con Azure Document Intelligence mejorado")
            
            # Obtener nombre del blob desde la URL
            blob_name = blob_url.split('/')[-1]
            
            # Descargar el archivo desde Azure Blob Storage
            blob_client = self.blob_client.get_blob_client(
                container=settings.AZURE_STORAGE_CONTAINER_NAME,
                blob=blob_name
            )
            
            blob_data = blob_client.download_blob().readall()
            
            # Analizar documento con Azure Document Intelligence
            async with self.doc_client:
                poller = await self.doc_client.begin_analyze_document(
                    "prebuilt-invoice",
                    document=blob_data
                )
                result = await poller.result()
                
                # Extraer datos relevantes con campos específicos
                extracted_data = {}
                
                # Mapeo de campos de Document Intelligence
                field_mapping = {
                    'VendorName': 'proveedor',
                    'CustomerName': 'cliente',
                    'InvoiceId': 'numero_factura',
                    'InvoiceDate': 'fecha_emision',
                    'DueDate': 'fecha_vencimiento',
                    'InvoiceTotal': 'total',
                    'SubTotal': 'subtotal',
                    'TotalTax': 'iva',
                    'Items': 'items'
                }
                
                for document in result.documents:
                    for name, field in document.fields.items():
                        if name in field_mapping:
                            extracted_data[field_mapping[name]] = field.value
                        else:
                            extracted_data[name.lower()] = field.value
                
                # Extraer información fiscal específica
                extracted_data = await self._extract_fiscal_info(extracted_data, result)
                
                return extracted_data
                
        except Exception as e:
            logger.error(f"Error en extracción mejorada: {str(e)}")
            raise
    
    async def _extract_fiscal_info(self, extracted_data: dict, doc_result) -> dict:
        """Extrae información fiscal específica (CUIT, tipo de comprobante)."""
        try:
            # Buscar CUIT en el texto extraído
            if hasattr(doc_result, 'content') and doc_result.content:
                content = doc_result.content
                
                # Patrones para detectar CUIT
                cuit_pattern = r'\b\d{2}-\d{8}-\d\b'
                cuit_match = re.search(cuit_pattern, content)
                if cuit_match:
                    extracted_data['cuit_proveedor'] = cuit_match.group()
                
                # Detectar tipo de comprobante
                content_upper = content.upper()
                if 'FACTURA A' in content_upper:
                    extracted_data['tipo_factura'] = 'A'
                elif 'FACTURA B' in content_upper:
                    extracted_data['tipo_factura'] = 'B'
                elif 'FACTURA C' in content_upper:
                    extracted_data['tipo_factura'] = 'C'
                elif 'COMPROBANTE' in content_upper:
                    extracted_data['tipo_factura'] = 'Otro'
                else:
                    extracted_data['tipo_factura'] = 'Desconocido'
                
                # Detectar CAE si está presente
                cae_pattern = r'CAE:\s*(\d+)'
                cae_match = re.search(cae_pattern, content, re.IGNORECASE)
                if cae_match:
                    extracted_data['cae'] = cae_match.group(1)
                
                # Detectar número de comprobante más específico
                comprobante_pattern = r'(?:FACTURA|COMPROBANTE)\s*[A-Z]?\s*N[O°]?\s*(\d+)'
                comprobante_match = re.search(comprobante_pattern, content_upper)
                if comprobante_match and 'numero_factura' not in extracted_data:
                    extracted_data['numero_factura'] = comprobante_match.group(1)
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error extrayendo información fiscal: {str(e)}")
            return extracted_data
    
    async def validate_and_clean_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida y limpia los datos usando Azure OpenAI con validación de coherencia."""
        try:
            logger.info("Validando y limpiando datos con Azure OpenAI mejorado")
            
            prompt = f"""
            Eres un experto en facturación argentina. Tu tarea es validar la consistencia de los datos de una factura,
            clasificarla (Tipo A, B, C) y formatear los datos en un JSON limpio y estandarizado.

            Datos extraídos de la factura:
            {json.dumps(extracted_data, indent=2, ensure_ascii=False)}

            Por favor, realiza las siguientes acciones:
            1. Valida la consistencia de los datos (ej: que la suma de subtotales e impuestos coincida con el total).
            2. Clasifica la factura como 'Tipo A', 'Tipo B', 'Tipo C' o 'Desconocido'.
            3. Formatea los datos en un JSON limpio y estandarizado con los siguientes campos (si están disponibles):
                - tipo_factura: (str) Tipo de factura (A, B, C, Desconocido)
                - proveedor: (str) Nombre del proveedor
                - cuit_proveedor: (str) CUIT del proveedor
                - fecha_emision: (str) Fecha de emisión (formato YYYY-MM-DD)
                - numero_factura: (str) Número de factura
                - items: (list de dict) Lista de ítems con 'descripcion', 'cantidad', 'precio_unitario', 'subtotal'
                - subtotal: (float) Subtotal de la factura
                - iva: (float) Monto del IVA
                - total: (float) Total de la factura
                - observaciones: (str) Cualquier observación importante
                - necesita_revision: (bool) True si los datos no son coherentes y necesitan revisión manual
                - razon_revision: (str) Explicación de por qué necesita revisión

            4. VALIDACIÓN DE COHERENCIA:
               - Verifica que subtotal + iva ≈ total (con tolerancia del 1%)
               - Verifica que el tipo de factura sea consistente con el CUIT
               - Marca como necesita_revision: true si encuentra inconsistencias

            Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
            """

            response = await self.openai_client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": "Eres un experto en facturación argentina. Responde siempre con JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                extra_headers={"api-version": settings.OPENAI_API_VERSION}
            )

            cleaned_data = json.loads(response.choices[0].message.content)
            
            # Validación adicional de coherencia
            cleaned_data = await self._validate_coherence(cleaned_data)
            
            return cleaned_data

        except Exception as e:
            logger.error(f"Error en validación/limpieza de datos: {str(e)}")
            # Retornar datos básicos en caso de error
            return {
                "tipo_factura": "Desconocido",
                "necesita_revision": True,
                "razon_revision": f"Error en procesamiento: {str(e)}",
                **extracted_data
            }
    
    async def _validate_coherence(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida la coherencia matemática de los datos de la factura."""
        try:
            # Validar coherencia matemática
            subtotal = float(data.get('subtotal', 0))
            iva = float(data.get('iva', 0))
            total = float(data.get('total', 0))
            
            # Calcular total esperado
            total_esperado = subtotal + iva
            diferencia = abs(total - total_esperado)
            tolerancia = total * 0.01  # 1% de tolerancia
            
            if diferencia > tolerancia:
                data['necesita_revision'] = True
                data['razon_revision'] = f"Inconsistencia matemática: Total ({total}) ≠ Subtotal ({subtotal}) + IVA ({iva})"
            
            # Validar tipo de factura vs CUIT
            tipo_factura = data.get('tipo_factura', '').upper()
            cuit = data.get('cuit_proveedor', '')
            
            if cuit and tipo_factura in ['A', 'B']:
                # Para facturas A y B, el CUIT debe ser de 11 dígitos
                cuit_limpio = cuit.replace('-', '')
                if len(cuit_limpio) != 11:
                    data['necesita_revision'] = True
                    data['razon_revision'] = f"CUIT inválido para factura tipo {tipo_factura}: {cuit}"
            
            return data
            
        except Exception as e:
            logger.error(f"Error en validación de coherencia: {str(e)}")
            data['necesita_revision'] = True
            data['razon_revision'] = f"Error en validación: {str(e)}"
            return data
    
    async def process_invoice(self, blob_url: str, user_id: int, invoice_id: int) -> Dict[str, Any]:
        """Procesa una factura completa con el agente mejorado."""
        try:
            # 1. Extraer datos con Document Intelligence
            extracted_data = await self.extract_with_doc_intelligence(blob_url)
            
            # 2. Validar y limpiar con IA
            cleaned_data = await self.validate_and_clean_data(extracted_data)
            
            # 3. Determinar estado final
            if cleaned_data.get('necesita_revision', False):
                status = "needs_review"
            else:
                status = "completed"
            
            return {
                "status": status,
                "extracted_data": cleaned_data,
                "processing_notes": cleaned_data.get('razon_revision', 'Procesamiento exitoso')
            }
            
        except Exception as e:
            logger.error(f"Error en procesamiento completo: {str(e)}")
            return {
                "status": "error",
                "error_message": str(e),
                "extracted_data": extracted_data if 'extracted_data' in locals() else {}
            }
