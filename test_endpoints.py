#!/usr/bin/env python3
"""
Script para probar los endpoints corregidos.
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_login():
    """Probar login y obtener token."""
    print("[LOGIN] Probando login...")
    
    login_data = {
        "username": "franco.test@opendoors.com",
        "password": "Ncc1701E@"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"[OK] Login exitoso")
        return token_data["access_token"]
    else:
        print(f"[ERROR] Error en login: {response.status_code}")
        print(response.text)
        return None

def test_partners_endpoint(token):
    """Probar endpoint de partners."""
    print("\n[PARTNERS] Probando endpoint de partners...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/partners/",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Partners endpoint funcionando")
        print(f"   Partners encontrados: {len(data)}")
        return True
    else:
        print(f"[ERROR] Error en partners: {response.status_code}")
        print(response.text)
        return False

def test_approval_endpoint(token):
    """Probar endpoint de aprobaciones."""
    print("\n[APPROVAL] Probando endpoint de aprobaciones...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/approval/pending",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Approval endpoint funcionando")
        print(f"   Aprobaciones pendientes: {len(data)}")
        return True
    else:
        print(f"[ERROR] Error en approval: {response.status_code}")
        print(response.text)
        return False

def test_financial_endpoints(token):
    """Probar endpoints financieros."""
    print("\n[FINANCIAL] Probando endpoints financieros...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Balance IVA
    response = requests.get(
        f"{BASE_URL}/api/v1/financial/balance-iva",
        headers=headers
    )
    
    if response.status_code == 200:
        print("[OK] Balance IVA endpoint funcionando")
    else:
        print(f"[ERROR] Error en balance IVA: {response.status_code}")
    
    # Balance General
    response = requests.get(
        f"{BASE_URL}/api/v1/financial/balance-general",
        headers=headers
    )
    
    if response.status_code == 200:
        print("[OK] Balance General endpoint funcionando")
        return True
    else:
        print(f"[ERROR] Error en balance general: {response.status_code}")
        return False

def main():
    """Función principal."""
    print("=" * 60)
    print("   PRUEBA DE ENDPOINTS CORREGIDOS - OPEN DOORS")
    print("=" * 60)
    
    # Probar login
    token = test_login()
    if not token:
        print("\n[ERROR] No se pudo obtener token. Verifica las credenciales.")
        return
    
    # Probar endpoints
    partners_ok = test_partners_endpoint(token)
    approval_ok = test_approval_endpoint(token)
    financial_ok = test_financial_endpoints(token)
    
    print("\n" + "=" * 60)
    print("   RESULTADOS DE PRUEBA")
    print("=" * 60)
    print(f"Partners: {'[OK]' if partners_ok else '[ERROR]'}")
    print(f"Approval: {'[OK]' if approval_ok else '[ERROR]'}")
    print(f"Financial: {'[OK]' if financial_ok else '[ERROR]'}")
    
    if all([partners_ok, approval_ok, financial_ok]):
        print("\n[SUCCESS] Todos los endpoints funcionan correctamente!")
        print("[SUCCESS] Las correcciones críticas han sido exitosas.")
    else:
        print("\n[WARNING] Algunos endpoints necesitan atención.")

if __name__ == "__main__":
    main()
