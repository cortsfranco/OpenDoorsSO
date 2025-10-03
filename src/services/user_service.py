"""
Servicio para gestión de usuarios con funcionalidades avanzadas.
"""

import os
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import UploadFile, HTTPException
from ..models.user import User
from ..core.security import get_password_hash, verify_password
# from ..services.azure_storage import AzureStorageService


class UserService:
    """Servicio para gestión de usuarios."""
    
    def __init__(self, db: Session):
        self.db = db
        # self.azure_storage = AzureStorageService()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Obtener usuario por ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Obtener usuario por email."""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Obtener todos los usuarios con paginación."""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def create_user(self, user_data: Dict[str, Any]) -> User:
        """Crear nuevo usuario."""
        # Verificar si el email ya existe
        if self.get_user_by_email(user_data['email']):
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Hash de la contraseña
        hashed_password = get_password_hash(user_data['password'])
        
        # Crear usuario
        user = User(
            email=user_data['email'],
            hashed_password=hashed_password,
            full_name=user_data['full_name'],
            role=user_data.get('role', 'editor'),
            phone=user_data.get('phone'),
            address=user_data.get('address'),
            birth_date=user_data.get('birth_date'),
            position=user_data.get('position'),
            department=user_data.get('department'),
            hire_date=user_data.get('hire_date'),
            salary=user_data.get('salary'),
            preferences=user_data.get('preferences', {})
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update_user(self, user_id: int, user_data: Dict[str, Any]) -> User:
        """Actualizar usuario existente."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar email único si se está cambiando
        if 'email' in user_data and user_data['email'] != user.email:
            existing_user = self.get_user_by_email(user_data['email'])
            if existing_user:
                raise HTTPException(status_code=400, detail="El email ya está registrado")
            user.email = user_data['email']
        
        # Actualizar campos permitidos
        allowed_fields = [
            'full_name', 'role', 'phone', 'address', 'birth_date',
            'position', 'department', 'hire_date', 'salary', 'preferences'
        ]
        
        for field in allowed_fields:
            if field in user_data:
                setattr(user, field, user_data[field])
        
        # Actualizar contraseña si se proporciona
        if 'password' in user_data:
            user.hashed_password = get_password_hash(user_data['password'])
        
        user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """Eliminar usuario (soft delete)."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def restore_user(self, user_id: int) -> bool:
        """Restaurar usuario eliminado."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def upload_profile_photo(self, user_id: int, photo_file: UploadFile) -> str:
        """Subir foto de perfil del usuario."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Validar tipo de archivo
        if not photo_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Generar nombre único para el archivo
        file_extension = os.path.splitext(photo_file.filename)[1]
        unique_filename = f"profile_photos/user_{user_id}_{uuid.uuid4()}{file_extension}"
        
        try:
            # TODO: Implementar subida a Azure Blob Storage
            # Por ahora, simular URL
            blob_url = f"https://storage.example.com/user-files/{unique_filename}"
            
            # Actualizar URL en la base de datos
            user.profile_photo_url = blob_url
            user.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            return blob_url
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al subir la imagen: {str(e)}")
    
    def delete_profile_photo(self, user_id: int) -> bool:
        """Eliminar foto de perfil del usuario."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        if user.profile_photo_url:
            try:
                # TODO: Eliminar archivo de Azure Blob Storage
                # Por ahora, solo limpiar URL
                pass
            except Exception:
                # Continuar aunque falle la eliminación del archivo
                pass
            
            # Limpiar URL en la base de datos
            user.profile_photo_url = None
            user.updated_at = datetime.utcnow()
            
            self.db.commit()
        
        return True
    
    def update_user_preferences(self, user_id: int, preferences: Dict[str, Any]) -> User:
        """Actualizar preferencias del usuario."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Mergear preferencias existentes con las nuevas
        current_preferences = user.preferences or {}
        current_preferences.update(preferences)
        
        user.preferences = current_preferences
        user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """Obtener estadísticas del usuario."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Calcular estadísticas básicas
        stats = {
            "total_invoices": len(user.invoices),
            "active_since": user.created_at,
            "last_activity": user.updated_at,
            "profile_completion": self._calculate_profile_completion(user)
        }
        
        return stats
    
    def _calculate_profile_completion(self, user: User) -> int:
        """Calcular porcentaje de completitud del perfil."""
        fields = [
            user.full_name,
            user.phone,
            user.address,
            user.birth_date,
            user.position,
            user.department,
            user.profile_photo_url
        ]
        
        completed_fields = sum(1 for field in fields if field is not None)
        return int((completed_fields / len(fields)) * 100)
