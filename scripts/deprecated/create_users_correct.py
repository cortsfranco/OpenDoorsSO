#!/usr/bin/env python3
"""
Script para crear usuarios con valores correctos del enum.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def create_users_correct():
    """Crear usuarios con valores correctos del enum."""
    async with AsyncSessionLocal() as session:
        try:
            # Hash simple para contraseña "123456"
            hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdX3LdXhGZ8G2"
            
            users_to_create = [
                {
                    "email": "cortsfranco@hotmail.com",
                    "full_name": "Franco Nicolás Corts Romeo",
                    "role": "ADMIN"
                },
                {
                    "email": "joni.tagua@opendoors.com",
                    "full_name": "Joni Tagua",
                    "role": "MANAGER"
                },
                {
                    "email": "hernan.pagani@opendoors.com",
                    "full_name": "Hernán Pagani",
                    "role": "MANAGER"
                }
            ]
            
            for user_data in users_to_create:
                # Verificar si ya existe el usuario
                result = await session.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": user_data["email"]}
                )
                existing_user = result.fetchone()
                
                if existing_user:
                    print(f"✅ Usuario ya existe: {user_data['full_name']}")
                    continue
                
                # Crear nuevo usuario
                await session.execute(
                    text("""
                        INSERT INTO users (email, hashed_password, full_name, role, is_active, created_at, updated_at)
                        VALUES (:email, :password, :name, :role, true, NOW(), NOW())
                    """),
                    {
                        "email": user_data["email"],
                        "password": hashed_password,
                        "name": user_data["full_name"],
                        "role": user_data["role"]
                    }
                )
                
                print(f"✅ Usuario creado: {user_data['full_name']}")
                print(f"   📧 Email: {user_data['email']}")
                print(f"   🔑 Contraseña: 123456")
                print(f"   👤 Rol: {user_data['role']}")
                print()
            
            await session.commit()
            print("🎉 Todos los usuarios están listos para usar el sistema!")
            
        except Exception as e:
            print(f"❌ Error creando usuarios: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(create_users_correct())
