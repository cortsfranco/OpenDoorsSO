#!/usr/bin/env python3
"""
Script para verificar las columnas de la tabla users.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def check_columns():
    """Verificar columnas de la tabla users."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position")
            )
            columns = [row[0] for row in result.fetchall()]
            print("Columnas de la tabla users:")
            for col in columns:
                print(f"  - {col}")
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(check_columns())
