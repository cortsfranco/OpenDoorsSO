"""
Endpoints para configuraciones del sistema.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import date
from ...core.database import get_session
from ...core.security import get_current_user
from ...models.user import User
from ...services.system_settings_service import SystemSettingsService

router = APIRouter()


class CurrencySettingsRequest(BaseModel):
    code: str  # ARS, USD, EUR, etc.
    symbol: str  # $, €, etc.
    position: str  # "before" o "after"
    decimals: int
    thousands_separator: str  # "." o ","
    decimal_separator: str  # "," o "."


class NumberFormatRequest(BaseModel):
    thousands_separator: str  # "." o ","
    decimal_separator: str  # "," o "."
    decimal_places: int


class FiscalYearRequest(BaseModel):
    year: int
    start_date: date
    end_date: date


class BackupSettingsRequest(BaseModel):
    daily_backup: bool
    backup_time: str  # "HH:MM" formato 24h
    retention_days: int
    backup_path: str


class UISettingsRequest(BaseModel):
    theme: str  # "light", "dark"
    language: str  # "es", "en"
    timezone: str  # "America/Argentina/Buenos_Aires"


class FormatNumberRequest(BaseModel):
    number: float
    decimal_places: int = None


class FormatCurrencyRequest(BaseModel):
    amount: float


@router.get("/currency")
async def get_currency_settings(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener configuraciones de moneda."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a las configuraciones del sistema"
        )
    
    settings_service = SystemSettingsService(db)
    return settings_service.get_currency_settings()


@router.put("/currency")
async def set_currency_settings(
    currency_settings: CurrencySettingsRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Establecer configuraciones de moneda."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar las configuraciones del sistema"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        setting = settings_service.set_currency_settings(currency_settings.dict())
        return {"message": "Configuraciones de moneda actualizadas correctamente", "setting": setting}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuraciones de moneda: {str(e)}"
        )


@router.get("/number-format")
async def get_number_format_settings(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener configuraciones de formato de números."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a las configuraciones del sistema"
        )
    
    settings_service = SystemSettingsService(db)
    return settings_service.get_number_format_settings()


@router.put("/number-format")
async def set_number_format_settings(
    format_settings: NumberFormatRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Establecer configuraciones de formato de números."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar las configuraciones del sistema"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        setting = settings_service.set_number_format_settings(format_settings.dict())
        return {"message": "Configuraciones de formato actualizadas correctamente", "setting": setting}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuraciones de formato: {str(e)}"
        )


@router.post("/format/number")
async def format_number(
    request: FormatNumberRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Formatear número según configuración del sistema."""
    settings_service = SystemSettingsService(db)
    
    try:
        formatted = settings_service.format_number(request.number, request.decimal_places)
        return {"formatted_number": formatted}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al formatear número: {str(e)}"
        )


@router.post("/format/currency")
async def format_currency(
    request: FormatCurrencyRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Formatear cantidad como moneda según configuración del sistema."""
    settings_service = SystemSettingsService(db)
    
    try:
        formatted = settings_service.format_currency(request.amount)
        return {"formatted_currency": formatted}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al formatear moneda: {str(e)}"
        )


@router.get("/fiscal-year/current")
async def get_current_fiscal_year(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener año fiscal actual."""
    settings_service = SystemSettingsService(db)
    
    fiscal_year = settings_service.get_current_fiscal_year()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró año fiscal actual"
        )
    
    return fiscal_year


@router.post("/fiscal-year")
async def create_fiscal_year(
    fiscal_year_data: FiscalYearRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo año fiscal."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear años fiscales"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        fiscal_year = settings_service.create_fiscal_year(
            year=fiscal_year_data.year,
            start_date=fiscal_year_data.start_date,
            end_date=fiscal_year_data.end_date
        )
        return {"message": "Año fiscal creado correctamente", "fiscal_year": fiscal_year}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear año fiscal: {str(e)}"
        )


@router.put("/fiscal-year/{year}/set-current")
async def set_current_fiscal_year(
    year: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Establecer año fiscal actual."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar años fiscales"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        fiscal_year = settings_service.set_current_fiscal_year(year)
        return {"message": f"Año fiscal {year} establecido como actual", "fiscal_year": fiscal_year}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al establecer año fiscal actual: {str(e)}"
        )


@router.get("/backup/settings")
async def get_backup_settings(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener configuraciones de backup."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a las configuraciones de backup"
        )
    
    settings_service = SystemSettingsService(db)
    return settings_service.get_backup_settings()


@router.put("/backup/settings")
async def set_backup_settings(
    backup_settings: BackupSettingsRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Establecer configuraciones de backup."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar las configuraciones de backup"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        setting = settings_service.set_backup_settings(backup_settings.dict())
        return {"message": "Configuraciones de backup actualizadas correctamente", "setting": setting}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuraciones de backup: {str(e)}"
        )


@router.post("/backup/perform")
async def perform_backup(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Realizar backup manual."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar backups"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        backup_log = settings_service.perform_backup()
        return {"message": "Backup iniciado correctamente", "backup_log": backup_log}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al realizar backup: {str(e)}"
        )


@router.get("/backup/logs")
async def get_backup_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener logs de backup."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a los logs de backup"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        logs = settings_service.get_backup_logs(limit)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener logs de backup: {str(e)}"
        )


@router.get("/ui")
async def get_ui_settings(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener configuraciones de interfaz."""
    settings_service = SystemSettingsService(db)
    return settings_service.get_ui_settings()


@router.put("/ui")
async def set_ui_settings(
    ui_settings: UISettingsRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Establecer configuraciones de interfaz."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar las configuraciones de interfaz"
        )
    
    settings_service = SystemSettingsService(db)
    
    try:
        setting = settings_service.set_ui_settings(ui_settings.dict())
        return {"message": "Configuraciones de interfaz actualizadas correctamente", "setting": setting}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuraciones de interfaz: {str(e)}"
        )
