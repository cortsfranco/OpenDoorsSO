#!/usr/bin/env python3
"""
Script para verificar la configuración de Azure AI.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Agregar el directorio raíz al path para importar módulos
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.config import settings

async def verify_azure_openai():
    """Verifica la configuración de Azure OpenAI."""
    print("🔍 Verificando Azure OpenAI...")
    
    if not settings.AZURE_OPENAI_ENDPOINT:
        print("❌ AZURE_OPENAI_ENDPOINT no configurado")
        return False
    
    if not settings.AZURE_OPENAI_API_KEY:
        print("❌ AZURE_OPENAI_API_KEY no configurado")
        return False
    
    print(f"✅ Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
    print(f"✅ Deployment: {settings.AZURE_OPENAI_DEPLOYMENT_NAME}")
    print(f"✅ API Version: {settings.OPENAI_API_VERSION}")
    
    # Probar conexión
    try:
        from openai import AzureOpenAI
        
        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": "Hello, this is a test message."}],
            max_tokens=10
        )
        
        print("✅ Conexión a Azure OpenAI exitosa")
        return True
        
    except Exception as e:
        print(f"❌ Error al conectar con Azure OpenAI: {str(e)}")
        return False

async def verify_azure_document_intelligence():
    """Verifica la configuración de Azure Document Intelligence."""
    print("\n🔍 Verificando Azure Document Intelligence...")
    
    if not settings.AZURE_DOC_INTELLIGENCE_ENDPOINT:
        print("❌ AZURE_DOC_INTELLIGENCE_ENDPOINT no configurado")
        return False
    
    if not settings.AZURE_DOC_INTELLIGENCE_KEY:
        print("❌ AZURE_DOC_INTELLIGENCE_KEY no configurado")
        return False
    
    print(f"✅ Endpoint: {settings.AZURE_DOC_INTELLIGENCE_ENDPOINT}")
    
    # Probar conexión
    try:
        from azure.ai.formrecognizer import DocumentAnalysisClient
        from azure.core.credentials import AzureKeyCredential
        
        client = DocumentAnalysisClient(
            endpoint=settings.AZURE_DOC_INTELLIGENCE_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_DOC_INTELLIGENCE_KEY)
        )
        
        print("✅ Cliente de Document Intelligence creado exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al crear cliente de Document Intelligence: {str(e)}")
        return False

async def verify_azure_storage():
    """Verifica la configuración de Azure Storage."""
    print("\n🔍 Verificando Azure Storage...")
    
    if not settings.AZURE_STORAGE_ACCOUNT_NAME:
        print("❌ AZURE_STORAGE_ACCOUNT_NAME no configurado")
        return False
    
    if not settings.AZURE_STORAGE_ACCOUNT_KEY:
        print("❌ AZURE_STORAGE_ACCOUNT_KEY no configurado")
        return False
    
    print(f"✅ Storage Account: {settings.AZURE_STORAGE_ACCOUNT_NAME}")
    print(f"✅ Container: {settings.AZURE_STORAGE_CONTAINER_NAME}")
    
    # Probar conexión
    try:
        from azure.storage.blob import BlobServiceClient
        
        connection_string = f"DefaultEndpointsProtocol=https;AccountName={settings.AZURE_STORAGE_ACCOUNT_NAME};AccountKey={settings.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net"
        
        client = BlobServiceClient.from_connection_string(connection_string)
        
        # Verificar si el contenedor existe
        container_client = client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
        properties = container_client.get_container_properties()
        
        print("✅ Conexión a Azure Storage exitosa")
        print(f"✅ Container existe: {properties.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error al conectar con Azure Storage: {str(e)}")
        return False

async def verify_azure_search():
    """Verifica la configuración de Azure Cognitive Search."""
    print("\n🔍 Verificando Azure Cognitive Search...")
    
    if not settings.AZURE_SEARCH_ENDPOINT:
        print("❌ AZURE_SEARCH_ENDPOINT no configurado")
        return False
    
    if not settings.AZURE_SEARCH_ADMIN_KEY:
        print("❌ AZURE_SEARCH_ADMIN_KEY no configurado")
        return False
    
    print(f"✅ Endpoint: {settings.AZURE_SEARCH_ENDPOINT}")
    print(f"✅ Index: {settings.AZURE_SEARCH_INDEX_NAME}")
    
    # Probar conexión
    try:
        from azure.search.documents import SearchClient
        from azure.core.credentials import AzureKeyCredential
        
        client = SearchClient(
            endpoint=settings.AZURE_SEARCH_ENDPOINT,
            index_name=settings.AZURE_SEARCH_INDEX_NAME,
            credential=AzureKeyCredential(settings.AZURE_SEARCH_ADMIN_KEY)
        )
        
        # Intentar hacer una búsqueda simple
        results = client.search(search_text="*", top=1)
        print("✅ Conexión a Azure Cognitive Search exitosa")
        return True
        
    except Exception as e:
        print(f"❌ Error al conectar con Azure Cognitive Search: {str(e)}")
        return False

async def main():
    """Función principal de verificación."""
    print("🚀 Verificando configuración de Azure AI para Open Doors\n")
    
    # Cargar variables de entorno
    load_dotenv()
    
    results = []
    
    # Verificar cada servicio
    results.append(await verify_azure_openai())
    results.append(await verify_azure_document_intelligence())
    results.append(await verify_azure_storage())
    results.append(await verify_azure_search())
    
    # Resumen
    print("\n" + "="*50)
    print("📊 RESUMEN DE VERIFICACIÓN")
    print("="*50)
    
    services = [
        "Azure OpenAI",
        "Azure Document Intelligence", 
        "Azure Storage",
        "Azure Cognitive Search"
    ]
    
    for i, service in enumerate(services):
        status = "✅ OK" if results[i] else "❌ ERROR"
        print(f"{service}: {status}")
    
    total_ok = sum(results)
    total_services = len(results)
    
    print(f"\nServicios configurados: {total_ok}/{total_services}")
    
    if total_ok == total_services:
        print("🎉 ¡Todos los servicios de Azure AI están configurados correctamente!")
        return True
    else:
        print("⚠️  Algunos servicios necesitan configuración. Revisa las credenciales en el archivo .env")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
