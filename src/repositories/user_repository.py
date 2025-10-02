"""
Repositorio específico para usuarios.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.repositories.base import SQLAlchemyRepository
from src.db.models.user import User, UserCreate, UserUpdate


class UserRepository(SQLAlchemyRepository[User, UserCreate, UserUpdate]):
    """
    Repositorio para gestionar usuarios.
    """
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Obtiene un usuario por su email.
        
        Args:
            email: Email del usuario
            
        Returns:
            Usuario encontrado o None
        """
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_company(self, company_id: int) -> list[User]:
        """
        Obtiene todos los usuarios de una empresa.
        
        Args:
            company_id: ID de la empresa
            
        Returns:
            Lista de usuarios de la empresa
        """
        result = await self.session.execute(
            select(User).where(User.company_id == company_id)
        )
        return result.scalars().all()
    
    async def get_active_users(self) -> list[User]:
        """
        Obtiene todos los usuarios activos.
        
        Returns:
            Lista de usuarios activos
        """
        result = await self.session.execute(
            select(User).where(User.is_active == True)
        )
        return result.scalars().all()
