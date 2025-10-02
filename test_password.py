#!/usr/bin/env python3
"""
Script para probar la verificación de contraseñas.
"""

import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.core.database import AsyncSessionLocal
from src.core.security import get_password_hash, verify_password
from sqlalchemy import text


async def test_password():
    """Probar verificación de contraseñas."""
    async with AsyncSessionLocal() as session:
        try:
            # Obtener el hash de Franco
            result = await session.execute(
                text("SELECT email, hashed_password FROM users WHERE email = 'cortsfranco@hotmail.com'")
            )
            user = result.fetchone()
            
            if user:
                email, hashed_password = user
                print(f"📧 Email: {email}")
                print(f"🔑 Hash guardado: {hashed_password}")
                
                # Probar diferentes contraseñas
                test_passwords = ["Franco2024!", "123456", "admin", "password"]
                
                for pwd in test_passwords:
                    is_valid = verify_password(pwd, hashed_password)
                    print(f"🔐 Contraseña '{pwd}': {'✅ VÁLIDA' if is_valid else '❌ INVÁLIDA'}")
                    
                    # Generar nuevo hash para comparar
                    new_hash = get_password_hash(pwd)
                    print(f"🆕 Nuevo hash para '{pwd}': {new_hash}")
                    print()
            else:
                print("❌ Usuario no encontrado")
                
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_password())
