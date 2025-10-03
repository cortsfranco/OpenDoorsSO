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
from src.services.validation_service import ArgentineValidationService

logger = logging.getLogger(__name__)


class EnhancedInvoiceProcessingAgent:
    """Agente mejorado de procesamiento de facturas con validación inteligente."""
    
    def __init__(self, session=None):
        self.session = session
        self.validation_service = ArgentineValidationService()
        
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
            
            # Determinar si es un archivo local o un blob de Azure
            if blob_url.startswith('file://'):
                # Archivo local
                file_path = blob_url.replace('file://', '')
                with open(file_path, 'rb') as f:
                    blob_data = f.read()
            else:
                # Blob de Azure Storage
                blob_name = blob_url.split('/')[-1]
                blob_client = self.blob_client.get_blob_client(
                    container=settings.AZURE_STORAGE_CONTAINER_NAME,
                    blob=blob_name
                )
                blob_data = blob_client.download_blob().readall()
            
            # Analizar documento con Azure Document Intelligence
            poller = self.doc_client.begin_analyze_document(
                "prebuilt-invoice",
                document=blob_data
            )
            result = poller.result()
            
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
    
    async def process_with_exhaustive_validation(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesar factura con validaciones exhaustivas de CUIT, CAE y tipo de factura.
        """
        try:
            logger.info("Iniciando procesamiento con validaciones exhaustivas")
            
            # 1. Validar datos básicos
            validation_results = self.validation_service.validate_complete_invoice(invoice_data)
            
            # 2. Determinar campos automáticamente
            enhanced_data = self._enhance_invoice_data(invoice_data)
            
            # 3. Aplicar correcciones automáticas
            corrected_data = self._apply_automatic_corrections(enhanced_data, validation_results)
            
            # 4. Generar reporte de validación
            validation_summary = self.validation_service.get_validation_summary(validation_results)
            
            # 5. Determinar estado final
            status = "completed" if validation_summary['is_valid'] else "needs_review"
            
            return {
                "status": status,
                "extracted_data": corrected_data,
                "validation_results": validation_results,
                "validation_summary": validation_summary,
                "processing_notes": self._generate_processing_notes(validation_results, corrected_data)
            }
            
        except Exception as e:
            logger.error(f"Error en procesamiento con validaciones: {str(e)}")
            return {
                "status": "error",
                "error_message": str(e),
                "extracted_data": invoice_data
            }
    
    def _enhance_invoice_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mejorar datos de la factura con determinaciones automáticas."""
        enhanced = data.copy()
        
        # Determinar dirección de la factura
        enhanced['invoice_direction'] = self.validation_service.determine_invoice_direction(data)
        
        # Determinar movimiento de cuenta
        enhanced['movimiento_cuenta'] = self.validation_service.determine_movimiento_cuenta(data)
        
        # Determinar si es compensación IVA
        enhanced['es_compensacion_iva'] = self._determine_compensacion_iva(data)
        
        # Determinar tipo de contabilidad
        enhanced['tipo_contabilidad'] = 'fiscal'  # Por defecto
        
        return enhanced
    
    def _determine_compensacion_iva(self, data: Dict[str, Any]) -> bool:
        """Determinar si la factura es para compensación IVA."""
        if data.get('invoice_direction') == 'recibida':
            if data.get('monto_iva', 0) > 0:
                return True
        return False
    
    def _apply_automatic_corrections(self, data: Dict[str, Any], validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Aplicar correcciones automáticas basadas en validaciones."""
        corrected = data.copy()
        
        for field, result in validation_results.items():
            if not result.is_valid:
                if field == 'cuit' and data.get('cuit'):
                    # Limpiar formato de CUIT
                    clean_cuit = re.sub(r'[^\d]', '', data['cuit'])
                    if len(clean_cuit) == 11:
                        corrected['cuit'] = f"{clean_cuit[:2]}-{clean_cuit[2:10]}-{clean_cuit[10]}"
                
                elif field == 'amounts':
                    # Corregir cálculos de montos
                    subtotal = data.get('subtotal', 0)
                    iva = data.get('monto_iva', 0)
                    corrected['monto_total'] = subtotal + iva
        
        return corrected
    
    def _generate_processing_notes(self, validation_results: Dict[str, Any], final_data: Dict[str, Any]) -> str:
        """Generar notas de procesamiento."""
        notes = []
        
        # Agregar notas de validación
        for field, result in validation_results.items():
            if not result.is_valid:
                notes.append(f"Campo {field}: {result.error_message}")
            if result.warning_message:
                notes.append(f"Advertencia {field}: {result.warning_message}")
        
        # Agregar determinaciones automáticas
        notes.append(f"Dirección determinada: {final_data.get('invoice_direction')}")
        notes.append(f"Movimiento de cuenta: {'Sí' if final_data.get('movimiento_cuenta') else 'No'}")
        notes.append(f"Compensación IVA: {'Sí' if final_data.get('es_compensacion_iva') else 'No'}")
        
        return "; ".join(notes)
