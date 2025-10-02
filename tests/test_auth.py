"""
Pruebas para el sistema de autenticación.
"""

import pytest
from httpx import AsyncClient
from src.db.models.user import User
from src.repositories.user_repository import UserRepository


class TestAuth:
    """Pruebas para el sistema de autenticación."""
    
    async def test_register_user(self, client: AsyncClient, test_user_data: dict):
        """Prueba el registro de un nuevo usuario."""
        response = await client.post("/api/auth/register", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "user_id" in data
    
    async def test_login_user(self, client: AsyncClient, test_user_data: dict):
        """Prueba el inicio de sesión de un usuario."""
        # Primero registrar el usuario
        await client.post("/api/auth/register", json=test_user_data)
        
        # Luego intentar iniciar sesión
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = await client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Prueba el inicio de sesión con credenciales inválidas."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    async def test_get_current_user(self, client: AsyncClient, test_user_data: dict):
        """Prueba obtener información del usuario actual."""
        # Registrar y hacer login
        await client.post("/api/auth/register", json=test_user_data)
        login_response = await client.post("/api/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        token = login_response.json()["access_token"]
        
        # Obtener información del usuario
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
    
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Prueba obtener información del usuario con token inválido."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
