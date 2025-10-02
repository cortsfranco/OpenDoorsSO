#!/usr/bin/env python3
"""
Script para configurar usuarios del sistema Open Doors.
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
from datetime import datetime


async def setup_users():
    """Configurar usuarios del sistema."""
    async with AsyncSessionLocal() as session:
        try:
            users_to_create = [
                {
                    "email": "cortsfranco@hotmail.com",
                    "password": "Ncc1701E",
                    "full_name": "Franco Nicolás Corts Romeo",
                    "role": "admin"
                },
                {
                    "email": "joni.tagua@opendoors.com",
                    "password": "123456",
                    "full_name": "Joni Tagua",
                    "role": "approver"
                },
                {
                    "email": "hernan.pagani@opendoors.com",
                    "password": "123456",
                    "full_name": "Hernán Pagani",
                    "role": "approver"
                }
            ]
            
            for user_data in users_to_create:
                # Verificar si ya existe el usuario
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"✅ Usuario ya existe: {user_data['full_name']}")
                    continue
                
                # Crear nuevo usuario
                hashed_password = get_password_hash(user_data["password"])
                
                new_user = User(
                    email=user_data["email"],
                    hashed_password=hashed_password,
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                session.add(new_user)
                await session.commit()
                
                print(f"✅ Usuario creado: {user_data['full_name']}")
                print(f"   📧 Email: {user_data['email']}")
                print(f"   🔑 Contraseña: {user_data['password']}")
                print(f"   👤 Rol: {user_data['role']}")
                print()
            
            print("🎉 Todos los usuarios están listos para usar el sistema!")
            
        except Exception as e:
            print(f"❌ Error configurando usuarios: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(setup_users())
