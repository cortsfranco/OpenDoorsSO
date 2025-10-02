#!/usr/bin/env python3
"""
Script para probar la funcionalidad de IA de Azure.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Agregar el directorio src al path
sys.path.append(str(Path(__file__).parent / "src"))

from src.core.config import settings
from src.agents.enhanced_invoice_processing_agent import EnhancedInvoiceProcessingAgent

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_azure_ai():
    """Prueba la funcionalidad de IA de Azure."""
    
    print("🔍 Verificando configuración de Azure...")
    
    # Verificar variables de entorno
    azure_vars = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY", 
        "AZURE_DOC_INTELLIGENCE_ENDPOINT",
        "AZURE_DOC_INTELLIGENCE_KEY",
        "AZURE_STORAGE_ACCOUNT_NAME",
        "AZURE_STORAGE_ACCOUNT_KEY"
    ]
    
    for var in azure_vars:
        value = getattr(settings, var, None)
        if value:
            print(f"✅ {var}: Configurado")
        else:
            print(f"❌ {var}: No configurado")
    
    print("\n🤖 Inicializando agente de procesamiento de facturas...")
    
    try:
        # Crear instancia del agente
        agent = EnhancedInvoiceProcessingAgent()
        
        # Verificar si los clientes se inicializaron
        if agent.doc_client:
            print("✅ Cliente de Document Intelligence: Inicializado")
        else:
            print("❌ Cliente de Document Intelligence: No inicializado")
            
        if agent.openai_client:
            print("✅ Cliente de OpenAI: Inicializado")
        else:
            print("❌ Cliente de OpenAI: No inicializado")
            
        if agent.blob_client:
            print("✅ Cliente de Blob Storage: Inicializado")
        else:
            print("❌ Cliente de Blob Storage: No inicializado")
        
        print("\n🧪 Probando procesamiento de factura...")
        
        # Datos de prueba
        test_data = {
            "blob_url": "https://example.com/test-invoice.pdf",
            "user_id": 1,
            "company_id": 1,
            "filename": "test-invoice.pdf"
        }
        
        # Intentar procesar una factura de prueba
        result = await agent.process_invoice(
            blob_url=test_data["blob_url"],
            user_id=test_data["user_id"],
            invoice_id=1  # ID de prueba
        )
        
        if result.get("success"):
            print("✅ Procesamiento de factura: Exitoso")
            print(f"📊 Datos extraídos: {result.get('extracted_data', {})}")
        else:
            print("❌ Procesamiento de factura: Falló")
            print(f"🔍 Error: {result.get('error', 'Error desconocido')}")
            
    except Exception as e:
        print(f"❌ Error al probar la IA: {str(e)}")
        logger.exception("Error detallado:")

if __name__ == "__main__":
    asyncio.run(test_azure_ai())