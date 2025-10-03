#!/usr/bin/env python3
"""
Script consolidado para crear usuario administrador inicial.
Reemplaza todos los scripts create_user*.py duplicados.
"""

import asyncio
import os
import sys
from pathlib import Path

# Agregar el directorio src al path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv
from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.core.security import get_password_hash

# Cargar variables de entorno
load_dotenv()

async def create_admin():
    """Crear usuario administrador inicial."""
    
    print("🔧 Creando usuario administrador...")
    
    try:
        async with AsyncSessionLocal() as session:
            # Verificar si ya existe un admin
            from sqlalchemy import select
            existing_admin = await session.execute(
                select(User).where(User.email == "admin@opendoors.com")
            )
            
            if existing_admin.scalar_one_or_none():
                print("⚠️  Usuario admin ya existe.")
                return
            
            # Crear admin
            admin = User(
                email="admin@opendoors.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrador Sistema",
                role="admin",
                is_active=True,
                is_verified=True
            )
            
            session.add(admin)
            await session.commit()
            
            print("✅ Usuario administrador creado exitosamente:")
            print(f"   Email: admin@opendoors.com")
            print(f"   Password: admin123")
            print(f"   Rol: admin")
            
    except Exception as e:
        print(f"❌ Error creando administrador: {e}")
        sys.exit(1)

async def create_test_users():
    """Crear usuarios de prueba según conversaciones con Joni y Hernán."""
    
    print("\n👥 Creando usuarios de prueba...")
    
    test_users = [
        {
            "email": "cortsfranco@hotmail.com",
            "password": "Ncc1701E@",
            "full_name": "Franco Nicolás Corts Romeo",
            "role": "admin"
        },
        {
            "email": "joni@opendoors.com", 
            "password": "joni123",
            "full_name": "Joni Tagua",
            "role": "aprobador"
        },
        {
            "email": "hernan@opendoors.com",
            "password": "hernan123", 
            "full_name": "Hernán Pagani",
            "role": "cargador"
        }
    ]
    
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select
            
            for user_data in test_users:
                # Verificar si ya existe
                existing = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                
                if existing.scalar_one_or_none():
                    print(f"⚠️  Usuario {user_data['email']} ya existe.")
                    continue
                
                # Crear usuario
                user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True,
                    is_verified=True
                )
                
                session.add(user)
                print(f"✅ Usuario creado: {user_data['full_name']} ({user_data['role']})")
            
            await session.commit()
            print("\n🎉 Todos los usuarios creados exitosamente.")
            
    except Exception as e:
        print(f"❌ Error creando usuarios: {e}")
        sys.exit(1)

async def main():
    """Función principal."""
    
    print("=" * 50)
    print("   SETUP DE USUARIOS - OPEN DOORS")
    print("=" * 50)
    
    # Verificar variables de entorno
    required_vars = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Variables de entorno faltantes: {', '.join(missing_vars)}")
        print("   Asegúrate de tener un archivo .env configurado.")
        sys.exit(1)
    
    # Crear usuarios
    await create_admin()
    await create_test_users()
    
    print("\n" + "=" * 50)
    print("   SETUP COMPLETADO")
    print("=" * 50)
    print("\n📋 Usuarios disponibles:")
    print("   • admin@opendoors.com (admin123) - Admin")
    print("   • cortsfranco@hotmail.com (Ncc1701E@) - Admin") 
    print("   • joni@opendoors.com (joni123) - Aprobador")
    print("   • hernan@opendoors.com (hernan123) - Cargador")
    print("\n🚀 Puedes iniciar el sistema con: docker-compose up")

if __name__ == "__main__":
    asyncio.run(main())
