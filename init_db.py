#!/usr/bin/env python3
"""
Script para inicializar la base de datos desde cero.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import engine, init_db
from src.models.user import User
from src.core.security import get_password_hash
from datetime import datetime


async def initialize_database():
    """Inicializar la base de datos y crear usuarios."""
    try:
        # Crear todas las tablas
        print("🔄 Creando tablas de la base de datos...")
        await init_db()
        print("✅ Tablas creadas exitosamente")
        
        # Crear usuarios
        print("🔄 Creando usuarios...")
        from src.core.database import AsyncSessionLocal
        
        async with AsyncSessionLocal() as session:
            users_to_create = [
                {
                    "email": "cortsfranco@hotmail.com",
                    "password": "123456",
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
            
            print("🎉 Base de datos inicializada completamente!")
            
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")


if __name__ == "__main__":
    asyncio.run(initialize_database())
