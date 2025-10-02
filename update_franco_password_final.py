#!/usr/bin/env python3
"""
Script para actualizar la contraseña de Franco con una más corta.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from src.core.security import get_password_hash
from sqlalchemy import text


async def update_franco_password():
    """Actualizar contraseña de Franco."""
    async with AsyncSessionLocal() as session:
        try:
            # Usar una contraseña más corta pero segura
            new_password = "Franco2024!"
            hashed_password = get_password_hash(new_password)
            
            print(f"🔐 Actualizando contraseña para cortsfranco@hotmail.com")
            print(f"🔑 Nueva contraseña: {new_password}")
            print(f"🔑 Hash generado: {hashed_password}")
            
            # Actualizar contraseña
            await session.execute(
                text("UPDATE users SET hashed_password = :hashed_password, updated_at = NOW() WHERE email = :email"),
                {"hashed_password": hashed_password, "email": "cortsfranco@hotmail.com"}
            )
            await session.commit()
            
            print("✅ Contraseña de Franco actualizada exitosamente")
            print(f"📧 Email: cortsfranco@hotmail.com")
            print(f"🔑 Nueva Contraseña: {new_password}")
            print(f"👤 Rol: ADMIN")
            
        except Exception as e:
            print(f"❌ Error actualizando contraseña: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(update_franco_password())
