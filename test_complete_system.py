#!/usr/bin/env python3
"""
Script para probar el sistema completo de doble contabilidad.
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

def test_system_health():
    """Probar salud del sistema."""
    print("\n[HEALTH] Probando salud del sistema...")
    
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Sistema saludable: {data.get('status')}")
        return True
    else:
        print(f"[ERROR] Sistema no saludable: {response.status_code}")
        return False

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
        print(f"[OK] Años fiscales obtenidos: {len(data)} años")
        for fy in data:
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
        print(f"   Ingresos: ${data.get('ingresos', 0):,.2f}")
        print(f"   Egresos: ${data.get('egresos', 0):,.2f}")
        print(f"   Balance: ${data.get('balance', 0):,.2f}")
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
        print(f"   Ingresos: ${data.get('ingresos', 0):,.2f}")
        print(f"   Egresos: ${data.get('egresos', 0):,.2f}")
        print(f"   Balance: ${data.get('balance', 0):,.2f}")
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

def test_existing_endpoints(token):
    """Probar endpoints existentes."""
    print("\n[EXISTING ENDPOINTS] Probando endpoints existentes...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Probar endpoints existentes
    endpoints = [
        ("/api/v1/partners/", "Partners"),
        ("/api/v1/approval/pending", "Approval"),
        ("/api/v1/financial/balance-iva", "Balance IVA"),
        ("/api/v1/financial/balance-general", "Balance General")
    ]
    
    results = []
    for endpoint, name in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        if response.status_code == 200:
            print(f"   [OK] {name}: Funcionando")
            results.append(True)
        else:
            print(f"   [ERROR] {name}: {response.status_code}")
            results.append(False)
    
    return all(results)

def main():
    """Función principal."""
    print("=" * 70)
    print("   PRUEBA COMPLETA DEL SISTEMA DE DOBLE CONTABILIDAD")
    print("=" * 70)
    
    # Probar salud del sistema
    if not test_system_health():
        print("\n[ERROR] Sistema no disponible. Verifica que el backend esté corriendo.")
        return
    
    # Probar login
    token = test_login()
    if not token:
        print("\n[ERROR] No se pudo obtener token. Verifica las credenciales.")
        return
    
    # Probar endpoints existentes
    existing_ok = test_existing_endpoints(token)
    
    # Probar nuevos endpoints
    fiscal_years_ok = test_fiscal_years(token)
    balance_real_ok = test_balance_real(token)
    balance_fiscal_ok = test_balance_fiscal(token)
    comprehensive_ok = test_comprehensive_report(token)
    
    print("\n" + "=" * 70)
    print("   RESULTADOS FINALES")
    print("=" * 70)
    print(f"Endpoints Existentes: {'[OK]' if existing_ok else '[ERROR]'}")
    print(f"Años Fiscales: {'[OK]' if fiscal_years_ok else '[ERROR]'}")
    print(f"Balance Real: {'[OK]' if balance_real_ok else '[ERROR]'}")
    print(f"Balance Fiscal: {'[OK]' if balance_fiscal_ok else '[ERROR]'}")
    print(f"Reporte Completo: {'[OK]' if comprehensive_ok else '[ERROR]'}")
    
    if all([existing_ok, fiscal_years_ok, balance_real_ok, balance_fiscal_ok, comprehensive_ok]):
        print("\n[SUCCESS] ¡Sistema de doble contabilidad completamente funcional!")
        print("[SUCCESS] Todos los endpoints están operativos.")
        print("[SUCCESS] Sistema listo para uso en producción.")
    else:
        print("\n[WARNING] Algunos componentes necesitan atención.")
        print("[INFO] Revisa los errores anteriores para completar la implementación.")

if __name__ == "__main__":
    main()
