#!/usr/bin/env python3
"""
Script para recrear las tablas de la base de datos.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import engine, init_db
from src.models import *  # Importar todos los modelos


async def recreate_tables():
    """Recrear todas las tablas."""
    try:
        # Eliminar todas las tablas con CASCADE
        print("🔄 Eliminando tablas existentes...")
        from src.models.base import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            # También eliminar enums si existen
            await conn.execute("DROP TYPE IF EXISTS userrole CASCADE")
            await conn.execute("DROP TYPE IF EXISTS invoicetype CASCADE")
            await conn.execute("DROP TYPE IF EXISTS invoicestatus CASCADE")
        
        # Crear todas las tablas
        print("🔄 Creando tablas...")
        await init_db()
        print("✅ Tablas recreadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error recreando tablas: {e}")


if __name__ == "__main__":
    asyncio.run(recreate_tables())
