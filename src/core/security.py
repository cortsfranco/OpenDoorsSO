"""
Módulo de seguridad para autenticación y autorización.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
import secrets
import hashlib

from src.core.database import get_session
from src.core.config import settings
from src.models.user import User

# Configuración para hash de contraseñas con bcrypt robusto
def get_password_hash(password: str) -> str:
    """Genera un hash seguro de la contraseña usando bcrypt."""
    try:
        # Truncar contraseña si es muy larga para bcrypt
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        
        # Generar salt aleatorio
        salt = bcrypt.gensalt(rounds=12)
        # Hash la contraseña con el salt
        password_bytes = password.encode('utf-8')
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"Error generando hash de contraseña: {e}")
        return ""

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    try:
        # Truncar contraseña si es muy larga para bcrypt
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    """Obtiene el usuario actual a partir del token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    query = select(User).where(User.email == email)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user