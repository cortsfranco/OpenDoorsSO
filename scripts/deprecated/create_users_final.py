#!/usr/bin/env python3
"""
Script para crear usuarios del sistema.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.core.security import get_password_hash
from sqlalchemy import select


async def create_users():
    """Crear usuarios del sistema."""
    async with AsyncSessionLocal() as session:
        try:
            users_to_create = [
                {
                    "email": "cortsfranco@hotmail.com",
                    "password": "Ncc1701E@",
                    "full_name": "Franco Nicolás Corts Romeo",
                    "role": "ADMIN"
                },
                {
                    "email": "joni.tagua@opendoors.com",
                    "password": "123456",
                    "full_name": "Joni Tagua",
                    "role": "USER"
                },
                {
                    "email": "hernan.pagani@opendoors.com",
                    "password": "123456",
                    "full_name": "Hernán Pagani",
                    "role": "USER"
                }
            ]
            
            for user_data in users_to_create:
                # Verificar si el usuario ya existe
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"⚠️ Usuario {user_data['email']} ya existe")
                    continue
                
                # Crear nuevo usuario
                hashed_password = get_password_hash(user_data["password"])
                new_user = User(
                    email=user_data["email"],
                    hashed_password=hashed_password,
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True
                )
                
                session.add(new_user)
                print(f"✅ Usuario {user_data['email']} creado exitosamente")
            
            await session.commit()
            print("🎉 Todos los usuarios creados exitosamente")
            
        except Exception as e:
            print(f"❌ Error creando usuarios: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(create_users())