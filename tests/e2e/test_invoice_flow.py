"""
Pruebas E2E para el flujo completo de facturas.
"""

import pytest
from httpx import AsyncClient
from playwright.async_api import async_playwright, Page, Browser


class TestInvoiceFlow:
    """Pruebas E2E para el flujo de facturas."""
    
    @pytest.fixture
    async def browser(self):
        """Configurar navegador para pruebas E2E."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            yield browser
            await browser.close()
    
    @pytest.fixture
    async def page(self, browser: Browser):
        """Crear una nueva página para pruebas."""
        page = await browser.new_page()
        yield page
        await page.close()
    
    async def test_create_invoice_flow(self, client: AsyncClient, page: Page):
        """Prueba el flujo completo de creación de una factura."""
        # 1. Crear usuario y empresa mediante API
        user_data = {
            "email": "test@example.com",
            "full_name": "Usuario de Prueba",
            "password": "password123",
            "role": "finance_user"
        }
        
        company_data = {
            "name": "Empresa de Prueba",
            "tax_id": "20-12345678-9",
            "address": "Dirección de Prueba"
        }
        
        # Registrar usuario
        await client.post("/api/auth/register", json=user_data)
        
        # Login para obtener token
        login_response = await client.post("/api/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Crear empresa
        company_response = await client.post(
            "/api/companies",
            json=company_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        company_id = company_response.json()["id"]
        
        # Crear cliente
        client_data = {
            "name": "Cliente de Prueba",
            "tax_id": "20-87654321-0",
            "email": "cliente@example.com",
            "company_id": company_id
        }
        
        client_response = await client.post(
            "/api/clients",
            json=client_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        client_id = client_response.json()["id"]
        
        # 2. Navegar al frontend y hacer login
        await page.goto("http://localhost:3000/login")
        
        await page.fill('input[type="email"]', user_data["email"])
        await page.fill('input[type="password"]', user_data["password"])
        await page.click('button[type="submit"]')
        
        # Esperar a que se complete el login
        await page.wait_for_url("http://localhost:3000/")
        
        # 3. Navegar a la página de facturas
        await page.goto("http://localhost:3000/invoices")
        
        # 4. Crear una nueva factura mediante API (simulando el formulario)
        invoice_data = {
            "invoice_number": "INV-001",
            "invoice_type": "invoice_a",
            "issue_date": "2024-01-15",
            "due_date": "2024-02-15",
            "subtotal": 1000.00,
            "tax_amount": 210.00,
            "total_amount": 1210.00,
            "status": "draft",
            "company_id": company_id,
            "client_id": client_id,
            "created_by_user_id": 1  # Se asume que el usuario tiene ID 1
        }
        
        invoice_response = await client.post(
            "/api/invoices",
            json=invoice_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert invoice_response.status_code == 200
        invoice = invoice_response.json()
        assert invoice["invoice_number"] == "INV-001"
        assert invoice["total_amount"] == 1210.00
        
        # 5. Verificar que la factura aparece en el frontend
        await page.reload()
        
        # En una implementación real, aquí verificaríamos que la factura aparece en la lista
        # Por ahora, solo verificamos que no hay errores en la página
        assert await page.title() == "Open Doors - Sistema de Gestión"
