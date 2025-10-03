"""
Router para gestión de usuarios y permisos.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.user_role import Permission, UserRole, UserWithPermissions
from src.services.permission_service import PermissionService

router = APIRouter()

# Esquemas Pydantic
class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.OPERARIO

class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PermissionAssignRequest(BaseModel):
    permission_ids: List[int]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    resource: str
    action: str

    class Config:
        from_attributes = True

@router.get("/users", response_model=List[UserWithPermissions], summary="Obtener todos los usuarios")
async def get_users(
    skip: int = Query(0, description="Número de usuarios a omitir"),
    limit: int = Query(100, description="Número máximo de usuarios a obtener"),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de usuarios con sus permisos.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver usuarios"
        )
    
    users = await permission_service.get_users_with_permissions(skip=skip, limit=limit)
    return users

@router.post("/users", response_model=UserResponse, summary="Crear nuevo usuario")
async def create_user(
    user_data: UserCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Crear nuevo usuario.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios"
        )
    
    # Verificar si el email ya existe
    from sqlalchemy import select
    existing_user = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está en uso"
        )
    
    # Crear usuario
    from src.core.security import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat(),
        updated_at=new_user.updated_at.isoformat()
    )

@router.put("/users/{user_id}", response_model=UserResponse, summary="Actualizar usuario")
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar usuario existente.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar usuarios"
        )
    
    # Obtener usuario
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar campos
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat()
    )

@router.delete("/users/{user_id}", summary="Eliminar usuario")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar usuario.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios"
        )
    
    # No permitir eliminarse a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )
    
    # Obtener usuario
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "Usuario eliminado exitosamente"}

@router.get("/permissions", response_model=List[PermissionResponse], summary="Obtener todos los permisos")
async def get_permissions(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de todos los permisos disponibles.
    """
    permission_service = PermissionService(db)
    
    permissions = await permission_service.get_all_permissions()
    return [
        PermissionResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            resource=p.resource,
            action=p.action
        ) for p in permissions
    ]

@router.post("/users/{user_id}/permissions", summary="Asignar permisos a usuario")
async def assign_user_permissions(
    user_id: int,
    request: PermissionAssignRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Asignar permisos específicos a un usuario.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para asignar permisos a usuarios"
        )
    
    try:
        user = await permission_service.assign_permissions_to_user(user_id, request.permission_ids)
        return {"message": f"Permisos asignados exitosamente a {user.full_name}"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/users/{user_id}/permissions", summary="Remover permisos de usuario")
async def remove_user_permissions(
    user_id: int,
    request: PermissionAssignRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Remover permisos específicos de un usuario.
    Requiere permisos de administrador.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "users", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para remover permisos de usuarios"
        )
    
    try:
        user = await permission_service.remove_permissions_from_user(user_id, request.permission_ids)
        return {"message": f"Permisos removidos exitosamente de {user.full_name}"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/users/{user_id}/permissions", summary="Obtener resumen de permisos de usuario")
async def get_user_permissions_summary(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener resumen de permisos de un usuario específico.
    """
    permission_service = PermissionService(db)
    
    # Los usuarios pueden ver sus propios permisos o necesitan permisos de administrador
    if user_id != current_user.id:
        if not await permission_service.has_permission(current_user.id, "users", "read"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver permisos de otros usuarios"
            )
    
    try:
        summary = await permission_service.get_user_permissions_summary(user_id)
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/initialize-permissions", summary="Inicializar permisos del sistema")
async def initialize_permissions(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Inicializar permisos y roles por defecto del sistema.
    Solo administradores.
    """
    permission_service = PermissionService(db)
    
    # Verificar permisos
    if not await permission_service.has_permission(current_user.id, "settings", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para inicializar permisos del sistema"
        )
    
    try:
        await permission_service.initialize_default_permissions()
        await permission_service.assign_default_role_permissions()
        
        return {"message": "Permisos del sistema inicializados exitosamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al inicializar permisos: {str(e)}"
        )

