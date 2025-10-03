"""
Endpoints para gestión de usuarios.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from ...core.database import get_session
from ...core.security import get_current_user
from ...models.user import User
from ...services.user_service import UserService

router = APIRouter()


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "editor"
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    position: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[date] = None
    salary: Optional[int] = None
    preferences: Optional[dict] = None


class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    position: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[date] = None
    salary: Optional[int] = None
    preferences: Optional[dict] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    profile_photo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    position: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[date] = None
    salary: Optional[int] = None
    preferences: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int


class UserStatisticsResponse(BaseModel):
    total_invoices: int
    active_since: datetime
    last_activity: datetime
    profile_completion: int


@router.get("/", response_model=UserListResponse)
async def get_users(
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener lista de usuarios con paginación."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )
    
    user_service = UserService(db)
    skip = (page - 1) * limit
    
    users = user_service.get_all_users(skip=skip, limit=limit)
    total_users = db.query(User).count()
    
    return UserListResponse(
        users=users,
        total=total_users,
        page=page,
        limit=limit
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Obtener información del usuario actual."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener información de un usuario específico."""
    # Los usuarios solo pueden ver su propia información, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo usuario."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios"
        )
    
    user_service = UserService(db)
    
    try:
        user = user_service.create_user(user_data.dict())
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Actualizar usuario."""
    # Los usuarios solo pueden actualizar su propia información, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )
    
    user_service = UserService(db)
    
    try:
        # Filtrar campos que no pueden ser actualizados por usuarios no-admin
        update_data = user_data.dict(exclude_unset=True)
        if current_user.role != "admin":
            # Los usuarios no-admin no pueden cambiar su rol
            update_data.pop("role", None)
        
        user = user_service.update_user(user_id, update_data)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {str(e)}"
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Eliminar usuario (soft delete)."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios"
        )
    
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )
    
    user_service = UserService(db)
    
    try:
        success = user_service.delete_user(user_id)
        if success:
            return {"message": "Usuario eliminado correctamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar usuario"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar usuario: {str(e)}"
        )


@router.post("/{user_id}/restore")
async def restore_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Restaurar usuario eliminado."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para restaurar usuarios"
        )
    
    user_service = UserService(db)
    
    try:
        success = user_service.restore_user(user_id)
        if success:
            return {"message": "Usuario restaurado correctamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al restaurar usuario"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al restaurar usuario: {str(e)}"
        )


@router.post("/{user_id}/profile-photo")
async def upload_profile_photo(
    user_id: int,
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Subir foto de perfil."""
    # Los usuarios solo pueden subir su propia foto, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para subir fotos de este usuario"
        )
    
    user_service = UserService(db)
    
    try:
        photo_url = user_service.upload_profile_photo(user_id, photo)
        return {"message": "Foto de perfil subida correctamente", "photo_url": photo_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir foto de perfil: {str(e)}"
        )


@router.delete("/{user_id}/profile-photo")
async def delete_profile_photo(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Eliminar foto de perfil."""
    # Los usuarios solo pueden eliminar su propia foto, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar fotos de este usuario"
        )
    
    user_service = UserService(db)
    
    try:
        success = user_service.delete_profile_photo(user_id)
        if success:
            return {"message": "Foto de perfil eliminada correctamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar foto de perfil"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar foto de perfil: {str(e)}"
        )


@router.put("/{user_id}/preferences")
async def update_user_preferences(
    user_id: int,
    preferences: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Actualizar preferencias del usuario."""
    # Los usuarios solo pueden actualizar sus propias preferencias, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar las preferencias de este usuario"
        )
    
    user_service = UserService(db)
    
    try:
        user = user_service.update_user_preferences(user_id, preferences)
        return {"message": "Preferencias actualizadas correctamente", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar preferencias: {str(e)}"
        )


@router.get("/{user_id}/statistics", response_model=UserStatisticsResponse)
async def get_user_statistics(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas del usuario."""
    # Los usuarios solo pueden ver sus propias estadísticas, excepto los admins
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a estas estadísticas"
        )
    
    user_service = UserService(db)
    
    try:
        stats = user_service.get_user_statistics(user_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )