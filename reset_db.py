#!/usr/bin/env python3
"""
Script para resetear completamente la base de datos.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def reset_database():
    """Resetear completamente la base de datos."""
    async with AsyncSessionLocal() as session:
        try:
            # Eliminar todas las tablas con CASCADE
            print("🔄 Eliminando todas las tablas...")
            await session.execute(text("DROP SCHEMA public CASCADE"))
            await session.execute(text("CREATE SCHEMA public"))
            await session.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
            await session.execute(text("GRANT ALL ON SCHEMA public TO public"))
            await session.commit()
            print("✅ Base de datos reseteada exitosamente")
            
        except Exception as e:
            print(f"❌ Error reseteando base de datos: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(reset_database())
