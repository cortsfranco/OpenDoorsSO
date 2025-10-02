#!/usr/bin/env python3
"""
Script para diagnosticar y configurar Azure OpenAI correctamente.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Agregar el directorio raíz al path para importar módulos
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.config import settings

async def list_deployments():
    """Lista todos los deployments disponibles en Azure OpenAI."""
    print("🔍 Listando deployments disponibles en Azure OpenAI...")
    
    try:
        from openai import AzureOpenAI
        
        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        
        # Probar deployments comunes
        common_deployments = [
            'gpt-4o',
            'gpt-4',
            'gpt-35-turbo',
            'gpt-4-turbo',
            'gpt-4o-mini'
        ]
        
        print("📋 Probando deployments comunes:")
        print("-" * 50)
        
        available_deployments = []
        for deployment in common_deployments:
            try:
                response = await asyncio.to_thread(
                    client.chat.completions.create,
                    model=deployment,
                    messages=[{"role": "user", "content": "Test"}],
                    max_tokens=1
                )
                print(f"✅ {deployment} - FUNCIONA")
                available_deployments.append(deployment)
            except Exception as e:
                print(f"❌ {deployment} - NO DISPONIBLE")
        
        if not available_deployments:
            print("❌ No se encontraron deployments disponibles")
            return []
        
        return available_deployments
        
    except Exception as e:
        print(f"❌ Error al listar deployments: {str(e)}")
        return []

async def test_deployment(deployment_name):
    """Prueba un deployment específico."""
    print(f"🧪 Probando deployment: {deployment_name}")
    
    try:
        from openai import AzureOpenAI
        
        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=deployment_name,
            messages=[{"role": "user", "content": "Hola, este es un test de conexión."}],
            max_tokens=10
        )
        
        print(f"✅ Deployment '{deployment_name}' funciona correctamente")
        print(f"   Respuesta: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ Error con deployment '{deployment_name}': {str(e)}")
        return False

async def main():
    """Función principal de diagnóstico."""
    print("🚀 Diagnosticando y configurando Azure OpenAI\n")
    
    # Cargar variables de entorno
    load_dotenv()
    
    print(f"📍 Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
    print(f"🔑 API Key: {'*' * 20}{settings.AZURE_OPENAI_API_KEY[-4:] if settings.AZURE_OPENAI_API_KEY else 'NO CONFIGURADO'}")
    print(f"📅 API Version: {settings.OPENAI_API_VERSION}")
    print(f"🎯 Deployment actual: {settings.AZURE_OPENAI_DEPLOYMENT_NAME}")
    print()
    
    # Listar deployments disponibles
    deployments = await list_deployments()
    
    if not deployments:
        print("💡 Soluciones sugeridas:")
        print("1. Verificar que el endpoint sea correcto")
        print("2. Verificar que la API key sea válida")
        print("3. Crear un deployment en Azure OpenAI Studio")
        print("4. Verificar permisos de acceso")
        return False
    
    # Probar el deployment actual
    current_works = await test_deployment(settings.AZURE_OPENAI_DEPLOYMENT_NAME)
    
    if current_works:
        print(f"🎉 El deployment actual '{settings.AZURE_OPENAI_DEPLOYMENT_NAME}' funciona correctamente!")
        return True
    
    # Probar otros deployments disponibles
    print(f"\n🔍 El deployment actual '{settings.AZURE_OPENAI_DEPLOYMENT_NAME}' no funciona.")
    print("Probando otros deployments disponibles...")
    
    working_deployments = []
    for deployment in deployments:
        if deployment != settings.AZURE_OPENAI_DEPLOYMENT_NAME:
            if await test_deployment(deployment):
                working_deployments.append(deployment)
    
    if working_deployments:
        print(f"\n💡 Deployments que funcionan:")
        for deployment in working_deployments:
            print(f"   ✅ {deployment}")
        
        print(f"\n🔧 Para usar '{working_deployments[0]}', actualiza tu archivo .env:")
        print(f"AZURE_OPENAI_DEPLOYMENT_NAME={working_deployments[0]}")
        return True
    else:
        print("\n❌ Ningún deployment está funcionando correctamente.")
        print("💡 Soluciones sugeridas:")
        print("1. Verificar que los deployments estén activos en Azure OpenAI Studio")
        print("2. Verificar cuotas y límites")
        print("3. Verificar que el modelo esté disponible")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
