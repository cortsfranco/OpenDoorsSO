"""
Configuración global de pytest para el proyecto Open Doors.
"""

import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel

from src.main import app
from src.core.database import get_session
from src.core.config import settings


# Configurar motor de prueba
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=True,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Crear un event loop para toda la sesión de pruebas."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def session():
    """Crear una sesión de base de datos para pruebas."""
    # Crear todas las tablas
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Crear sesión
    async with AsyncSessionLocal() as session:
        yield session
    
    # Limpiar tablas después de la prueba
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(session: AsyncSession):
    """Crear un cliente HTTP para pruebas."""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Datos de usuario de prueba."""
    return {
        "email": "test@example.com",
        "full_name": "Usuario de Prueba",
        "password": "password123",
        "role": "employee"
    }


@pytest.fixture
def test_company_data():
    """Datos de empresa de prueba."""
    return {
        "name": "Empresa de Prueba",
        "tax_id": "20-12345678-9",
        "address": "Dirección de Prueba",
        "phone": "+54 11 1234-5678",
        "email": "empresa@example.com"
    }


@pytest.fixture
def test_client_data():
    """Datos de cliente de prueba."""
    return {
        "name": "Cliente de Prueba",
        "tax_id": "20-87654321-0",
        "email": "cliente@example.com",
        "phone": "+54 11 8765-4321",
        "address": "Dirección del Cliente"
    }
