"""
Patrón Repository Genérico con ABC.
Proporciona una interfaz común para todos los repositorios.
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlmodel import SQLModel
from pydantic import BaseModel

# Tipos genéricos para el patrón Repository
T = TypeVar('T', bound=SQLModel)  # Modelo de base de datos
CreateSchema = TypeVar('CreateSchema', bound=BaseModel)  # Schema de creación
UpdateSchema = TypeVar('UpdateSchema', bound=BaseModel)  # Schema de actualización


class BaseRepository(ABC, Generic[T, CreateSchema, UpdateSchema]):
    """
    Clase base abstracta para repositorios.
    Define el contrato común para todas las operaciones CRUD.
    """
    
    def __init__(self, session: AsyncSession, model: Type[T]):
        """
        Inicializa el repositorio.
        
        Args:
            session: Sesión de SQLAlchemy
            model: Clase del modelo SQLModel
        """
        self.session = session
        self.model = model
    
    @abstractmethod
    async def create(self, obj_in: CreateSchema) -> T:
        """
        Crea un nuevo objeto en la base de datos.
        
        Args:
            obj_in: Datos para crear el objeto
            
        Returns:
            El objeto creado
        """
        pass
    
    @abstractmethod
    async def get(self, id: Any) -> Optional[T]:
        """
        Obtiene un objeto por su ID.
        
        Args:
            id: ID del objeto
            
        Returns:
            El objeto encontrado o None
        """
        pass
    
    @abstractmethod
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[T]:
        """
        Obtiene múltiples objetos con paginación y filtros.
        
        Args:
            skip: Número de registros a omitir
            limit: Número máximo de registros a retornar
            filters: Diccionario de filtros a aplicar
            
        Returns:
            Lista de objetos encontrados
        """
        pass
    
    @abstractmethod
    async def update(self, id: Any, obj_in: UpdateSchema) -> Optional[T]:
        """
        Actualiza un objeto existente.
        
        Args:
            id: ID del objeto a actualizar
            obj_in: Datos de actualización
            
        Returns:
            El objeto actualizado o None si no existe
        """
        pass
    
    @abstractmethod
    async def delete(self, id: Any) -> bool:
        """
        Elimina un objeto por su ID.
        
        Args:
            id: ID del objeto a eliminar
            
        Returns:
            True si se eliminó exitosamente, False en caso contrario
        """
        pass
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Cuenta el número de objetos que coinciden con los filtros.
        
        Args:
            filters: Diccionario de filtros a aplicar
            
        Returns:
            Número de objetos que coinciden
        """
        query = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        result = await self.session.execute(query)
        return len(result.scalars().all())


class SQLAlchemyRepository(BaseRepository[T, CreateSchema, UpdateSchema]):
    """
    Implementación concreta del repositorio usando SQLAlchemy.
    """
    
    async def create(self, obj_in: CreateSchema) -> T:
        """Crea un nuevo objeto en la base de datos."""
        # Convertir el schema a diccionario y crear instancia del modelo
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_data)
        
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj
    
    async def get(self, id: Any) -> Optional[T]:
        """Obtiene un objeto por su ID."""
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[T]:
        """Obtiene múltiples objetos con paginación y filtros."""
        query = select(self.model)
        
        # Aplicar filtros
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    if isinstance(value, list):
                        query = query.where(getattr(self.model, key).in_(value))
                    else:
                        query = query.where(getattr(self.model, key) == value)
        
        # Aplicar paginación
        query = query.offset(skip).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update(self, id: Any, obj_in: UpdateSchema) -> Optional[T]:
        """Actualiza un objeto existente."""
        # Obtener el objeto existente
        db_obj = await self.get(id)
        if not db_obj:
            return None
        
        # Actualizar los campos
        obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj
    
    async def delete(self, id: Any) -> bool:
        """Elimina un objeto por su ID."""
        db_obj = await self.get(id)
        if not db_obj:
            return False
        
        await self.session.delete(db_obj)
        await self.session.commit()
        return True
    
    async def get_with_relationships(
        self, 
        id: Any, 
        relationships: List[str]
    ) -> Optional[T]:
        """
        Obtiene un objeto con sus relaciones cargadas.
        
        Args:
            id: ID del objeto
            relationships: Lista de nombres de relaciones a cargar
            
        Returns:
            El objeto con relaciones cargadas o None
        """
        query = select(self.model).where(self.model.id == id)
        
        # Cargar relaciones
        for rel in relationships:
            if hasattr(self.model, rel):
                query = query.options(selectinload(getattr(self.model, rel)))
        
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
