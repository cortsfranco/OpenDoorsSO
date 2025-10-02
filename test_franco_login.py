#!/usr/bin/env python3
"""
Script para probar el login con las credenciales de Franco.
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_franco_login():
    """Prueba el login con las credenciales de Franco."""
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "cortsfranco@hotmail.com",  # OAuth2PasswordRequestForm usa 'username'
        "password": "Ncc1701E@"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Login Franco - Status: {response.status_code}")
        print(f"Login Franco - Response: {response.json()}")
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except Exception as e:
        print(f"Error en login Franco: {e}")
        return None

def test_get_current_user(token):
    """Prueba obtener información del usuario actual."""
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Usuario actual Franco - Status: {response.status_code}")
        print(f"Usuario actual Franco - Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error al obtener usuario actual Franco: {e}")
        return False

def main():
    """Ejecuta las pruebas para Franco."""
    print("=== PRUEBAS DE LOGIN FRANCO ===\n")
    
    # 1. Probar login
    print("1. Probando login con credenciales de Franco...")
    token = test_franco_login()
    print()
    
    if token:
        # 2. Probar obtener usuario actual
        print("2. Probando obtener usuario actual...")
        user_success = test_get_current_user(token)
        print()
        
        # Resumen de resultados
        print("=== RESUMEN DE PRUEBAS FRANCO ===")
        print(f"Login: {'EXITO' if token else 'FALLO'}")
        print(f"Usuario actual: {'EXITO' if user_success else 'FALLO'}")
        print(f"\nCredenciales configuradas:")
        print(f"Email: cortsfranco@hotmail.com")
        print(f"Contraseña: Ncc1701E@")
        print(f"Rol: admin")
        print(f"Nombre: Franco Nicolás Corts Romeo")
    else:
        print("FALLO: No se pudo obtener token de Franco")

if __name__ == "__main__":
    main()
