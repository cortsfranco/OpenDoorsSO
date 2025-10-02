#!/usr/bin/env python3
"""
Script para arreglar la tabla users.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from sqlalchemy import text


async def fix_users_table():
    """Arreglar la tabla users."""
    async with AsyncSessionLocal() as session:
        try:
            # Eliminar la tabla users
            print("🔄 Eliminando tabla users...")
            await session.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            await session.commit()
            
            # Recrear la tabla users
            print("🔄 Recreando tabla users...")
            await session.execute(text("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'editor' NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE NOT NULL,
                    profile_photo_url VARCHAR(500),
                    phone VARCHAR(20),
                    address TEXT,
                    birth_date TIMESTAMP,
                    position VARCHAR(100),
                    department VARCHAR(100),
                    hire_date TIMESTAMP,
                    salary INTEGER,
                    preferences JSON,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    company_id INTEGER
                )
            """))
            await session.commit()
            print("✅ Tabla users recreada exitosamente")
            
        except Exception as e:
            print(f"❌ Error arreglando tabla users: {e}")
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(fix_users_table())
