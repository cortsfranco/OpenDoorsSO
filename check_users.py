#!/usr/bin/env python3
"""
Script para verificar usuarios en la base de datos.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def check_users():
    """Verificar usuarios en la base de datos."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                text("SELECT email, full_name, role, is_active FROM users")
            )
            users = result.fetchall()
            
            print("👥 Usuarios en la base de datos:")
            for user in users:
                print(f"  📧 {user[0]} - {user[1]} ({user[2]}) - Activo: {user[3]}")
            
            if not users:
                print("❌ No hay usuarios en la base de datos")
                
        except Exception as e:
            print(f"❌ Error verificando usuarios: {e}")


if __name__ == "__main__":
    asyncio.run(check_users())
