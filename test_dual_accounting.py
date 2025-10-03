#!/usr/bin/env python3
"""
Script para probar los nuevos endpoints del sistema de dos contabilidades.
"""

import requests
import json
from datetime import datetime

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

def test_fiscal_years(token):
    """Probar endpoint de años fiscales."""
    print("\n[FISCAL YEARS] Probando endpoint de años fiscales...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/dual-accounting/fiscal-years",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Años fiscales obtenidos")
        print(f"   Años disponibles: {len(data.get('fiscal_years', []))}")
        for fy in data.get('fiscal_years', []):
            print(f"   - {fy['label']} {'(Actual)' if fy.get('current') else ''}")
        return True
    else:
        print(f"[ERROR] Error en años fiscales: {response.status_code}")
        print(response.text)
        return False

def test_balance_real(token):
    """Probar endpoint de balance real."""
    print("\n[BALANCE REAL] Probando endpoint de balance real...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/dual-accounting/balance-real",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Balance real obtenido")
        print(f"   Tipo: {data.get('tipo')}")
        print(f"   Período: {data.get('periodo', {}).get('label')}")
        balance_data = data.get('data', {})
        print(f"   Ingresos: ${balance_data.get('ingresos', 0):,.2f}")
        print(f"   Egresos: ${balance_data.get('egresos', 0):,.2f}")
        print(f"   Balance: ${balance_data.get('balance', 0):,.2f}")
        return True
    else:
        print(f"[ERROR] Error en balance real: {response.status_code}")
        print(response.text)
        return False

def test_balance_fiscal(token):
    """Probar endpoint de balance fiscal."""
    print("\n[BALANCE FISCAL] Probando endpoint de balance fiscal...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/dual-accounting/balance-fiscal",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Balance fiscal obtenido")
        print(f"   Tipo: {data.get('tipo')}")
        print(f"   Período: {data.get('periodo', {}).get('label')}")
        balance_data = data.get('data', {})
        print(f"   Ingresos: ${balance_data.get('ingresos', 0):,.2f}")
        print(f"   Egresos: ${balance_data.get('egresos', 0):,.2f}")
        print(f"   Balance: ${balance_data.get('balance', 0):,.2f}")
        return True
    else:
        print(f"[ERROR] Error en balance fiscal: {response.status_code}")
        print(response.text)
        return False

def test_comprehensive_report(token):
    """Probar endpoint de reporte completo."""
    print("\n[COMPREHENSIVE REPORT] Probando endpoint de reporte completo...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/dual-accounting/comprehensive-report",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Reporte completo obtenido")
        print(f"   Período: {data.get('period', {}).get('label')}")
        print(f"   Balance Real: ${data.get('balance_real', {}).get('balance', 0):,.2f}")
        print(f"   Balance Fiscal: ${data.get('balance_fiscal', {}).get('balance', 0):,.2f}")
        print(f"   Balance IVA: ${data.get('balance_iva', {}).get('balance_iva', 0):,.2f}")
        return True
    else:
        print(f"[ERROR] Error en reporte completo: {response.status_code}")
        print(response.text)
        return False

def test_balance_by_owner(token):
    """Probar endpoint de balance por propietario."""
    print("\n[BALANCE BY OWNER] Probando endpoint de balance por propietario...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/dual-accounting/balance-by-owner",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Balance por propietario obtenido")
        print(f"   Período: {data.get('periodo', {}).get('label')}")
        owner_balances = data.get('owner_balances', [])
        print(f"   Propietarios: {len(owner_balances)}")
        for owner in owner_balances:
            print(f"   - {owner['owner']}: ${owner['balance_real']['balance']:,.2f}")
        return True
    else:
        print(f"[ERROR] Error en balance por propietario: {response.status_code}")
        print(response.text)
        return False

def main():
    """Función principal."""
    print("=" * 60)
    print("   PRUEBA DEL SISTEMA DE DOS CONTABILIDADES")
    print("=" * 60)
    
    # Probar login
    token = test_login()
    if not token:
        print("\n[ERROR] No se pudo obtener token. Verifica las credenciales.")
        return
    
    # Probar endpoints
    fiscal_years_ok = test_fiscal_years(token)
    balance_real_ok = test_balance_real(token)
    balance_fiscal_ok = test_balance_fiscal(token)
    comprehensive_ok = test_comprehensive_report(token)
    balance_by_owner_ok = test_balance_by_owner(token)
    
    print("\n" + "=" * 60)
    print("   RESULTADOS DE PRUEBA")
    print("=" * 60)
    print(f"Años Fiscales: {'[OK]' if fiscal_years_ok else '[ERROR]'}")
    print(f"Balance Real: {'[OK]' if balance_real_ok else '[ERROR]'}")
    print(f"Balance Fiscal: {'[OK]' if balance_fiscal_ok else '[ERROR]'}")
    print(f"Reporte Completo: {'[OK]' if comprehensive_ok else '[ERROR]'}")
    print(f"Balance por Propietario: {'[OK]' if balance_by_owner_ok else '[ERROR]'}")
    
    if all([fiscal_years_ok, balance_real_ok, balance_fiscal_ok, comprehensive_ok, balance_by_owner_ok]):
        print("\n[SUCCESS] ¡Todos los endpoints del sistema de dos contabilidades funcionan correctamente!")
        print("[SUCCESS] Sistema listo para uso en producción.")
    else:
        print("\n[WARNING] Algunos endpoints necesitan atención.")

if __name__ == "__main__":
    main()
