#!/usr/bin/env python3
"""
Script para probar la API del sistema Open Doors.
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_register_user():
    """Prueba el registro de un usuario."""
    url = f"{BASE_URL}/auth/register"
    data = {
        "email": "admin@opendoors.com",
        "password": "admin",
        "full_name": "Administrador Open Doors",
        "role": "admin"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Registro - Status: {response.status_code}")
        print(f"Registro - Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error en registro: {e}")
        return False

def test_login():
    """Prueba el login de un usuario."""
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "admin@opendoors.com",  # OAuth2PasswordRequestForm usa 'username'
        "password": "admin"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Login - Status: {response.status_code}")
        print(f"Login - Response: {response.json()}")
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except Exception as e:
        print(f"Error en login: {e}")
        return None

def test_get_current_user(token):
    """Prueba obtener información del usuario actual."""
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Usuario actual - Status: {response.status_code}")
        print(f"Usuario actual - Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error al obtener usuario actual: {e}")
        return False

def test_get_invoices_summary(token):
    """Prueba obtener el resumen de facturas."""
    url = f"{BASE_URL}/invoices/summary"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Resumen facturas - Status: {response.status_code}")
        print(f"Resumen facturas - Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error al obtener resumen: {e}")
        return False

def main():
    """Ejecuta todas las pruebas."""
    print("=== PRUEBAS DE LA API OPEN DOORS ===\n")
    
    # 1. Probar registro
    print("1. Probando registro de usuario...")
    register_success = test_register_user()
    print()
    
    # 2. Probar login
    print("2. Probando login...")
    token = test_login()
    print()
    
    if token:
        # 3. Probar obtener usuario actual
        print("3. Probando obtener usuario actual...")
        user_success = test_get_current_user(token)
        print()
        
        # 4. Probar resumen de facturas
        print("4. Probando resumen de facturas...")
        summary_success = test_get_invoices_summary(token)
        print()
        
        # Resumen de resultados
        print("=== RESUMEN DE PRUEBAS ===")
        print(f"Registro: {'EXITO' if register_success else 'FALLO'}")
        print(f"Login: {'EXITO' if token else 'FALLO'}")
        print(f"Usuario actual: {'EXITO' if user_success else 'FALLO'}")
        print(f"Resumen facturas: {'EXITO' if summary_success else 'FALLO'}")
    else:
        print("No se pudo obtener token, saltando pruebas autenticadas")

if __name__ == "__main__":
    main()
