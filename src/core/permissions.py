"""
Sistema de permisos para Open Doors Billing
"""
from enum import Enum
from typing import List
from src.models.user import User, UserRole

class Permission(str, Enum):
    """Permisos del sistema"""
    # Usuarios
    USER_VIEW = "user:view"
    USER_CREATE = "user:create"
    USER_EDIT = "user:edit"
    USER_DELETE = "user:delete"
    
    # Facturas
    INVOICE_VIEW = "invoice:view"
    INVOICE_CREATE = "invoice:create"
    INVOICE_EDIT = "invoice:edit"
    INVOICE_DELETE = "invoice:delete"
    INVOICE_APPROVE = "invoice:approve"
    INVOICE_RESTORE = "invoice:restore"
    
    # Reportes
    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"
    
    # Configuración
    SETTINGS_VIEW = "settings:view"
    SETTINGS_EDIT = "settings:edit"

# Mapeo de roles a permisos
ROLE_PERMISSIONS = {
    UserRole.SUPERADMIN: [
        Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_EDIT, Permission.USER_DELETE,
        Permission.INVOICE_VIEW, Permission.INVOICE_CREATE, Permission.INVOICE_EDIT, Permission.INVOICE_DELETE,
        Permission.INVOICE_APPROVE, Permission.INVOICE_RESTORE,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
        Permission.SETTINGS_VIEW, Permission.SETTINGS_EDIT
    ],
    UserRole.ADMIN: [
        Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_EDIT,
        Permission.INVOICE_VIEW, Permission.INVOICE_CREATE, Permission.INVOICE_EDIT, Permission.INVOICE_DELETE,
        Permission.INVOICE_APPROVE, Permission.INVOICE_RESTORE,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
        Permission.SETTINGS_VIEW, Permission.SETTINGS_EDIT
    ],
    UserRole.ACCOUNTANT: [
        Permission.INVOICE_VIEW, Permission.INVOICE_CREATE, Permission.INVOICE_EDIT, Permission.INVOICE_APPROVE,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT
    ],
    UserRole.APPROVER: [
        Permission.INVOICE_VIEW, Permission.INVOICE_APPROVE,
        Permission.REPORT_VIEW
    ],
    UserRole.EDITOR: [
        Permission.INVOICE_VIEW, Permission.INVOICE_CREATE, Permission.INVOICE_EDIT,
        Permission.REPORT_VIEW
    ],
    UserRole.PARTNER: [
        Permission.INVOICE_VIEW,
        Permission.REPORT_VIEW
    ],
    UserRole.VIEWER: [
        Permission.INVOICE_VIEW,
        Permission.REPORT_VIEW
    ]
}

def has_permission(user: User, permission: Permission) -> bool:
    """
    Verifica si un usuario tiene un permiso específico
    """
    if not user.is_active:
        return False
    
    user_permissions = ROLE_PERMISSIONS.get(user.role, [])
    return permission in user_permissions

def get_user_permissions(user: User) -> List[Permission]:
    """
    Obtiene todos los permisos de un usuario
    """
    if not user.is_active:
        return []
    
    return ROLE_PERMISSIONS.get(user.role, [])

def require_permission(permission: Permission):
    """
    Decorator para requerir un permiso específico
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Esta función se implementará en los routers
            return func(*args, **kwargs)
        return wrapper
    return decorator
