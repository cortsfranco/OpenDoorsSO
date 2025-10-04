"""
<<<<<<< HEAD
Sistema de permisos y control de acceso del sistema Open Doors.
Franco es el ÚNICO superadmin con control total.
"""

from functools import wraps
from fastapi import HTTPException, status, Depends
from src.models.user import User
from src.core.security import get_current_user
from typing import List, Callable

# Jerarquía de roles (de mayor a menor privilegio)
ROLE_HIERARCHY = {
    'superadmin': 5,  # Franco únicamente
    'admin': 4,       # Hernán, Joni
    'accountant': 3,  # Contador
    'partner': 2,     # Socios/clientes
    'viewer': 1       # Solo lectura
}

# Email del ÚNICO superadmin
SUPERADMIN_EMAIL = "cortsfranco@hotmail.com"

class PermissionError(Exception):
    """Excepción personalizada para errores de permisos."""
    pass


def check_role_level(user: User, required_level: int) -> bool:
    """
    Verifica si el usuario tiene el nivel de rol requerido.
    
    Args:
        user: Usuario a verificar
        required_level: Nivel mínimo requerido
    
    Returns:
        True si el usuario tiene el nivel suficiente
    """
    user_level = ROLE_HIERARCHY.get(user.role, 0)
    return user_level >= required_level


def is_superadmin(user: User) -> bool:
    """
    Verifica si el usuario es el superadmin (Franco).
    Solo Franco puede ser superadmin.
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si es Franco (superadmin)
    """
    return user.role == 'superadmin' and user.email == SUPERADMIN_EMAIL


def is_admin_or_higher(user: User) -> bool:
    """
    Verifica si el usuario es admin o superadmin.
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si es admin o superadmin
    """
    return user.role in ['admin', 'superadmin']


def can_edit_invoices(user: User) -> bool:
    """
    Verifica si el usuario puede editar facturas.
    Permitido para: superadmin, admin
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede editar facturas
    """
    return user.role in ['superadmin', 'admin']


def can_approve_invoices(user: User) -> bool:
    """
    Verifica si el usuario puede aprobar facturas.
    Permitido para: superadmin, admin, accountant
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede aprobar facturas
    """
    return user.role in ['superadmin', 'admin', 'accountant']


def can_delete_invoices(user: User) -> bool:
    """
    Verifica si el usuario puede eliminar facturas.
    Permitido para: superadmin, admin
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede eliminar facturas
    """
    return user.role in ['superadmin', 'admin']


def can_manage_users(user: User) -> bool:
    """
    Verifica si el usuario puede gestionar otros usuarios.
    Permitido SOLO para: superadmin (Franco)
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede gestionar usuarios (solo Franco)
    """
    return is_superadmin(user)


def can_change_roles(user: User) -> bool:
    """
    Verifica si el usuario puede cambiar roles de otros usuarios.
    Permitido SOLO para: superadmin (Franco)
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede cambiar roles (solo Franco)
    """
    return is_superadmin(user)


def can_view_financial_reports(user: User) -> bool:
    """
    Verifica si el usuario puede ver reportes financieros.
    Permitido para: todos excepto viewer
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede ver reportes financieros
    """
    return user.role in ['superadmin', 'admin', 'accountant', 'partner']


def can_access_system_settings(user: User) -> bool:
    """
    Verifica si el usuario puede acceder a configuración del sistema.
    Permitido SOLO para: superadmin (Franco)
    
    Args:
        user: Usuario a verificar
    
    Returns:
        True si puede acceder a configuración (solo Franco)
    """
    return is_superadmin(user)


# ===== DECORADORES PARA ENDPOINTS =====

def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """
    Decorator/dependency que requiere rol superadmin.
    SOLO Franco puede pasar esta verificación.
    
    Usage:
        @router.post("/admin-only")
        async def admin_endpoint(user: User = Depends(require_superadmin)):
            ...
    """
    if not is_superadmin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo el superadmin puede realizar esta acción."
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Decorator/dependency que requiere rol admin o superior.
    
    Usage:
        @router.post("/admin-action")
        async def admin_action(user: User = Depends(require_admin)):
            ...
    """
    if not is_admin_or_higher(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de administrador."
        )
    return current_user


def require_invoice_editor(current_user: User = Depends(get_current_user)) -> User:
    """
    Decorator/dependency que requiere permisos para editar facturas.
    
    Usage:
        @router.put("/invoices/{invoice_id}")
        async def update_invoice(user: User = Depends(require_invoice_editor)):
            ...
    """
    if not can_edit_invoices(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No tienes permisos para editar facturas."
        )
    return current_user


def require_invoice_approver(current_user: User = Depends(get_current_user)) -> User:
    """
    Decorator/dependency que requiere permisos para aprobar facturas.
    
    Usage:
        @router.post("/invoices/{invoice_id}/approve")
        async def approve_invoice(user: User = Depends(require_invoice_approver)):
            ...
    """
    if not can_approve_invoices(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No tienes permisos para aprobar facturas."
        )
    return current_user


def require_financial_access(current_user: User = Depends(get_current_user)) -> User:
    """
    Decorator/dependency que requiere acceso a reportes financieros.
    
    Usage:
        @router.get("/financial/balance")
        async def get_balance(user: User = Depends(require_financial_access)):
            ...
    """
    if not can_view_financial_reports(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No tienes permisos para ver reportes financieros."
        )
    return current_user


def get_user_permissions(user: User) -> dict:
    """
    Obtiene un diccionario con todos los permisos del usuario.
    Útil para el frontend.
    
    Args:
        user: Usuario
    
    Returns:
        Diccionario con permisos booleanos
    """
    return {
        'is_superadmin': is_superadmin(user),
        'is_admin': is_admin_or_higher(user),
        'can_edit_invoices': can_edit_invoices(user),
        'can_approve_invoices': can_approve_invoices(user),
        'can_delete_invoices': can_delete_invoices(user),
        'can_manage_users': can_manage_users(user),
        'can_change_roles': can_change_roles(user),
        'can_view_financial_reports': can_view_financial_reports(user),
        'can_access_system_settings': can_access_system_settings(user),
        'role': user.role,
        'role_level': ROLE_HIERARCHY.get(user.role, 0)
    }
=======
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
>>>>>>> refs/remotes/origin/master
