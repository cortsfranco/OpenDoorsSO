#!/usr/bin/env python3
"""
Script para probar la conexión del backend y el login
"""

import requests
import json
import sys

def test_backend_connection():
    """Probar conexión básica con el backend"""
    print("🔍 Probando conexión con el backend...")
    
    try:
        # Probar endpoint de salud
        response = requests.get("http://localhost:8001/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend está respondiendo correctamente")
            print(f"   Respuesta: {response.text}")
            return True
        else:
            print(f"❌ Backend respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_login():
    """Probar el endpoint de login"""
    print("\n🔐 Probando login...")
    
    login_data = {
        "username": "franco.test@opendoors.com",
        "password": "Ncc1701E@"
    }
    
    try:
        response = requests.post(
            "http://localhost:8001/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"   Código de respuesta: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login exitoso!")
            data = response.json()
            if "access_token" in data:
                print("   Token de acceso recibido")
            return True
        else:
            print(f"❌ Error en login: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Respuesta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error en login: {e}")
        return False

def test_docs():
    """Probar acceso a la documentación"""
    print("\n📚 Probando acceso a documentación...")
    
    try:
        response = requests.get("http://localhost:8001/docs", timeout=10)
        if response.status_code == 200:
            print("✅ Documentación accesible")
            return True
        else:
            print(f"❌ Error accediendo a documentación: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error accediendo a documentación: {e}")
        return False

def main():
    print("🚀 INICIANDO PRUEBAS DEL BACKEND")
    print("=" * 50)
    
    # Probar conexión
    backend_ok = test_backend_connection()
    
    if not backend_ok:
        print("\n❌ Backend no está disponible. Verificar que esté ejecutándose.")
        sys.exit(1)
    
    # Probar documentación
    test_docs()
    
    # Probar login
    login_ok = test_login()
    
    print("\n" + "=" * 50)
    if backend_ok and login_ok:
        print("🎉 TODAS LAS PRUEBAS PASARON - EL SISTEMA ESTÁ FUNCIONANDO")
        print("✅ El frontend debería poder conectarse al backend sin problemas")
    else:
        print("⚠️  ALGUNAS PRUEBAS FALLARON")
        print("   Verificar la configuración del backend")

if __name__ == "__main__":
    main()
