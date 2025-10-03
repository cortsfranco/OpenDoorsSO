"""
Servicio de gestión de permisos y roles.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from src.models.user import User
from src.models.user_role import Permission, RolePermission, UserRole, UserWithPermissions
from src.core.security import get_password_hash

class PermissionService:
    """Servicio para gestión de permisos y roles."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_all_permissions(self) -> List[Permission]:
        """Obtener todos los permisos disponibles."""
        result = await self.session.execute(
            select(Permission).order_by(Permission.resource, Permission.action)
        )
        return result.scalars().all()
    
    async def get_permission_by_id(self, permission_id: int) -> Optional[Permission]:
        """Obtener permiso por ID."""
        result = await self.session.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        return result.scalar_one_or_none()
    
    async def get_permissions_by_role(self, role: UserRole) -> List[Permission]:
        """Obtener permisos de un rol específico."""
        result = await self.session.execute(
            select(Permission)
            .join(RolePermission, Permission.id == RolePermission.permission_id)
            .where(RolePermission.role == role)
        )
        return result.scalars().all()
    
    async def create_permission(self, permission_data: dict) -> Permission:
        """Crear nuevo permiso."""
        permission = Permission(**permission_data)
        self.session.add(permission)
        await self.session.commit()
        await self.session.refresh(permission)
        return permission
    
    async def assign_permission_to_role(self, role: UserRole, permission_id: int) -> RolePermission:
        """Asignar permiso a un rol."""
        # Verificar que el permiso existe
        permission = await self.get_permission_by_id(permission_id)
        if not permission:
            raise ValueError(f"Permiso con ID {permission_id} no encontrado")
        
        # Verificar que no esté ya asignado
        existing = await self.session.execute(
            select(RolePermission).where(
                and_(
                    RolePermission.role == role,
                    RolePermission.permission_id == permission_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"El permiso ya está asignado al rol {role}")
        
        role_permission = RolePermission(role=role, permission_id=permission_id)
        self.session.add(role_permission)
        await self.session.commit()
        await self.session.refresh(role_permission)
        return role_permission
    
    async def remove_permission_from_role(self, role: UserRole, permission_id: int) -> bool:
        """Remover permiso de un rol."""
        result = await self.session.execute(
            select(RolePermission).where(
                and_(
                    RolePermission.role == role,
                    RolePermission.permission_id == permission_id
                )
            )
        )
        role_permission = result.scalar_one_or_none()
        
        if role_permission:
            await self.session.delete(role_permission)
            await self.session.commit()
            return True
        return False
    
    async def get_users_with_permissions(self, skip: int = 0, limit: int = 100) -> List[UserWithPermissions]:
        """Obtener usuarios con sus permisos."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.permissions))
            .offset(skip)
            .limit(limit)
        )
        users = result.scalars().all()
        
        users_with_permissions = []
        for user in users:
            user_permissions = [p for p in user.permissions] if user.permissions else []
            users_with_permissions.append(UserWithPermissions(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                is_active=user.is_active,
                permissions=user_permissions,
                created_at=user.created_at,
                updated_at=user.updated_at
            ))
        
        return users_with_permissions
    
    async def assign_permissions_to_user(self, user_id: int, permission_ids: List[int]) -> User:
        """Asignar permisos específicos a un usuario."""
        user = await self.session.get(User, user_id)
        if not user:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")
        
        # Obtener permisos
        permissions = await self.session.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        permissions_list = permissions.scalars().all()
        
        if len(permissions_list) != len(permission_ids):
            raise ValueError("Algunos permisos no fueron encontrados")
        
        # Asignar permisos
        user.permissions = permissions_list
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def remove_permissions_from_user(self, user_id: int, permission_ids: List[int]) -> User:
        """Remover permisos específicos de un usuario."""
        user = await self.session.get(User, user_id)
        if not user:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")
        
        # Remover permisos
        user.permissions = [p for p in user.permissions if p.id not in permission_ids]
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def has_permission(self, user_id: int, resource: str, action: str) -> bool:
        """Verificar si un usuario tiene un permiso específico."""
        user = await self.session.execute(
            select(User)
            .options(selectinload(User.permissions))
            .where(User.id == user_id)
        )
        user_obj = user.scalar_one_or_none()
        
        if not user_obj:
            return False
        
        # Verificar permisos directos del usuario
        for permission in user_obj.permissions:
            if permission.resource == resource and permission.action == action:
                return True
        
        # Verificar permisos del rol
        role_permissions = await self.get_permissions_by_role(user_obj.role)
        for permission in role_permissions:
            if permission.resource == resource and permission.action == action:
                return True
        
        return False
    
    async def get_user_permissions_summary(self, user_id: int) -> Dict[str, Any]:
        """Obtener resumen de permisos de un usuario."""
        user = await self.session.execute(
            select(User)
            .options(selectinload(User.permissions))
            .where(User.id == user_id)
        )
        user_obj = user.scalar_one_or_none()
        
        if not user_obj:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")
        
        # Obtener permisos del rol
        role_permissions = await self.get_permissions_by_role(user_obj.role)
        
        # Combinar permisos directos y de rol
        all_permissions = list(user_obj.permissions) + role_permissions
        unique_permissions = {f"{p.resource}:{p.action}": p for p in all_permissions}
        
        return {
            'user_id': user_id,
            'role': user_obj.role,
            'is_admin': user_obj.role == UserRole.ADMIN,
            'can_manage_users': self._has_permission_in_list(unique_permissions, 'users', 'create'),
            'can_approve_invoices': self._has_permission_in_list(unique_permissions, 'invoices', 'approve'),
            'can_access_reports': self._has_permission_in_list(unique_permissions, 'reports', 'read'),
            'can_edit_invoices': self._has_permission_in_list(unique_permissions, 'invoices', 'update'),
            'can_delete_invoices': self._has_permission_in_list(unique_permissions, 'invoices', 'delete'),
            'total_permissions': len(unique_permissions),
            'permissions': list(unique_permissions.values())
        }
    
    def _has_permission_in_list(self, permissions: Dict[str, Permission], resource: str, action: str) -> bool:
        """Verificar si existe un permiso en la lista."""
        return f"{resource}:{action}" in permissions
    
    async def initialize_default_permissions(self) -> None:
        """Inicializar permisos por defecto del sistema."""
        default_permissions = [
            # Permisos de usuarios
            {"name": "users:create", "description": "Crear usuarios", "resource": "users", "action": "create"},
            {"name": "users:read", "description": "Ver usuarios", "resource": "users", "action": "read"},
            {"name": "users:update", "description": "Editar usuarios", "resource": "users", "action": "update"},
            {"name": "users:delete", "description": "Eliminar usuarios", "resource": "users", "action": "delete"},
            
            # Permisos de facturas
            {"name": "invoices:create", "description": "Crear facturas", "resource": "invoices", "action": "create"},
            {"name": "invoices:read", "description": "Ver facturas", "resource": "invoices", "action": "read"},
            {"name": "invoices:update", "description": "Editar facturas", "resource": "invoices", "action": "update"},
            {"name": "invoices:delete", "description": "Eliminar facturas", "resource": "invoices", "action": "delete"},
            {"name": "invoices:approve", "description": "Aprobar facturas", "resource": "invoices", "action": "approve"},
            
            # Permisos de reportes
            {"name": "reports:read", "description": "Ver reportes", "resource": "reports", "action": "read"},
            {"name": "reports:export", "description": "Exportar reportes", "resource": "reports", "action": "export"},
            
            # Permisos de configuración
            {"name": "settings:read", "description": "Ver configuración", "resource": "settings", "action": "read"},
            {"name": "settings:update", "description": "Editar configuración", "resource": "settings", "action": "update"},
        ]
        
        for perm_data in default_permissions:
            # Verificar si el permiso ya existe
            existing = await self.session.execute(
                select(Permission).where(Permission.name == perm_data["name"])
            )
            if not existing.scalar_one_or_none():
                await self.create_permission(perm_data)
        
        await self.session.commit()
    
    async def assign_default_role_permissions(self) -> None:
        """Asignar permisos por defecto a los roles."""
        role_permissions = {
            UserRole.ADMIN: [
                "users:create", "users:read", "users:update", "users:delete",
                "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:approve",
                "reports:read", "reports:export",
                "settings:read", "settings:update"
            ],
            UserRole.CONTADOR: [
                "users:read",
                "invoices:create", "invoices:read", "invoices:update", "invoices:approve",
                "reports:read", "reports:export",
                "settings:read"
            ],
            UserRole.SOCIO: [
                "invoices:create", "invoices:read", "invoices:update",
                "reports:read"
            ],
            UserRole.OPERARIO: [
                "invoices:create", "invoices:read",
                "reports:read"
            ],
            UserRole.READONLY: [
                "invoices:read",
                "reports:read"
            ]
        }
        
        for role, permission_names in role_permissions.items():
            for perm_name in permission_names:
                # Obtener el permiso
                result = await self.session.execute(
                    select(Permission).where(Permission.name == perm_name)
                )
                permission = result.scalar_one_or_none()
                
                if permission:
                    # Verificar si ya está asignado
                    existing = await self.session.execute(
                        select(RolePermission).where(
                            and_(
                                RolePermission.role == role,
                                RolePermission.permission_id == permission.id
                            )
                        )
                    )
                    
                    if not existing.scalar_one_or_none():
                        role_perm = RolePermission(role=role, permission_id=permission.id)
                        self.session.add(role_perm)
        
        await self.session.commit()

