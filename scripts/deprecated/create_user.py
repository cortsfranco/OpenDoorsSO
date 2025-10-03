#!/usr/bin/env python3
"""
Script para crear un usuario con hash de contraseña válido.
"""

import asyncio
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(__file__))

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.user import User

# Configuración de bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# URL de la base de datos
DATABASE_URL = "postgresql+asyncpg://postgres:opendoors_password@localhost:5432/opendoors_db"

async def create_user():
    """Crear un usuario con hash de contraseña válido."""
    # Crear engine y session
    engine = create_async_engine(DATABASE_URL)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        try:
            # Generar hash de la contraseña (truncar si es necesario)
            password = "admin"
            if len(password) > 72:
                password = password[:72]
            hashed_password = pwd_context.hash(password)
            print(f"Hash generado: {hashed_password}")
            
            # Crear usuario
            user = User(
                email="admin@opendoors.com",
                hashed_password=hashed_password,
                full_name="Administrador Open Doors",
                role="admin",
                is_active=True
            )
            
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            print(f"Usuario creado exitosamente: {user.email}")
            
        except Exception as e:
            print(f"Error al crear usuario: {e}")
            await session.rollback()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_user())
