#!/usr/bin/env python3
"""
Script para verificar valores del enum userrole.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def check_enum():
    """Verificar valores del enum userrole."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT unnest(enum_range(NULL::userrole))"))
            values = [row[0] for row in result.fetchall()]
            print(f"Valores del enum userrole: {values}")
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(check_enum())
