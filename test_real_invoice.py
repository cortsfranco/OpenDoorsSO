#!/usr/bin/env python3
"""
Script para probar el procesamiento de una factura real.
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

async def test_real_invoice():
    """Prueba el procesamiento de una factura real."""
    
    print("🔍 Verificando facturas disponibles...")
    
    uploads_dir = Path("uploads")
    if not uploads_dir.exists():
        print("❌ No se encontró la carpeta uploads")
        return
    
    pdf_files = list(uploads_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No se encontraron archivos PDF en uploads")
        return
    
    print(f"✅ Encontrados {len(pdf_files)} archivos PDF")
    
    # Usar el primer archivo
    test_file = pdf_files[0]
    print(f"📄 Probando con: {test_file.name}")
    
    print("\n🤖 Inicializando agente de procesamiento...")
    
    try:
        agent = EnhancedInvoiceProcessingAgent()
        
        # Crear URL de blob para el archivo local
        blob_url = f"file://{test_file.absolute()}"
        
        print(f"🔗 URL del archivo: {blob_url}")
        
        # Intentar procesar la factura
        print("\n🧪 Procesando factura...")
        result = await agent.process_invoice(
            blob_url=blob_url,
            user_id=1,
            invoice_id=1
        )
        
        if result.get("success"):
            print("✅ Procesamiento de factura: Exitoso")
            print(f"📊 Datos extraídos:")
            
            extracted_data = result.get("extracted_data", {})
            for key, value in extracted_data.items():
                print(f"   {key}: {value}")
                
        else:
            print("❌ Procesamiento de factura: Falló")
            print(f"🔍 Error: {result.get('error', 'Error desconocido')}")
            
    except Exception as e:
        print(f"❌ Error al procesar la factura: {str(e)}")
        logger.exception("Error detallado:")

if __name__ == "__main__":
    asyncio.run(test_real_invoice())
