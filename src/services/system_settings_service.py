"""
Servicio para gestión de configuraciones del sistema.
"""

import json
import os
import subprocess
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from ..models.system_settings import SystemSettings, FiscalYear, BackupLog


class SystemSettingsService:
    """Servicio para gestión de configuraciones del sistema."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_setting(self, key: str) -> Optional[SystemSettings]:
        """Obtener configuración por clave."""
        return self.db.query(SystemSettings).filter(
            SystemSettings.key == key,
            SystemSettings.is_active == True
        ).first()
    
    def get_setting_value(self, key: str, default: Any = None) -> Any:
        """Obtener valor de configuración."""
        setting = self.get_setting(key)
        return setting.value if setting else default
    
    def set_setting(self, key: str, value: Any, description: str = None, category: str = "general") -> SystemSettings:
        """Establecer configuración."""
        setting = self.get_setting(key)
        
        if setting:
            setting.value = value
            setting.description = description or setting.description
            setting.updated_at = datetime.utcnow()
        else:
            setting = SystemSettings(
                key=key,
                value=value,
                description=description,
                category=category
            )
            self.db.add(setting)
        
        self.db.commit()
        self.db.refresh(setting)
        return setting
    
    def get_currency_settings(self) -> Dict[str, Any]:
        """Obtener configuraciones de moneda."""
        return self.get_setting_value("currency", {
            "code": "ARS",
            "symbol": "$",
            "position": "before",
            "decimals": 2,
            "thousands_separator": ".",
            "decimal_separator": ","
        })
    
    def set_currency_settings(self, currency_config: Dict[str, Any]) -> SystemSettings:
        """Establecer configuraciones de moneda."""
        return self.set_setting(
            key="currency",
            value=currency_config,
            description="Configuración de moneda del sistema",
            category="currency"
        )
    
    def get_number_format_settings(self) -> Dict[str, Any]:
        """Obtener configuraciones de formato de números."""
        return self.get_setting_value("number_format", {
            "thousands_separator": ".",
            "decimal_separator": ",",
            "decimal_places": 2
        })
    
    def set_number_format_settings(self, format_config: Dict[str, Any]) -> SystemSettings:
        """Establecer configuraciones de formato de números."""
        return self.set_setting(
            key="number_format",
            value=format_config,
            description="Configuración de formato de números",
            category="format"
        )
    
    def get_current_fiscal_year(self) -> Optional[FiscalYear]:
        """Obtener año fiscal actual."""
        return self.db.query(FiscalYear).filter(FiscalYear.is_current == True).first()
    
    def get_fiscal_year_by_year(self, year: int) -> Optional[FiscalYear]:
        """Obtener año fiscal por año."""
        return self.db.query(FiscalYear).filter(FiscalYear.year == year).first()
    
    def create_fiscal_year(self, year: int, start_date: date, end_date: date, is_current: bool = False) -> FiscalYear:
        """Crear nuevo año fiscal."""
        # Si se establece como actual, desactivar otros años fiscales actuales
        if is_current:
            self.db.query(FiscalYear).update({"is_current": False})
        
        fiscal_year = FiscalYear(
            year=year,
            start_date=datetime.combine(start_date, datetime.min.time()),
            end_date=datetime.combine(end_date, datetime.max.time()),
            is_current=is_current
        )
        
        self.db.add(fiscal_year)
        self.db.commit()
        self.db.refresh(fiscal_year)
        
        return fiscal_year
    
    def set_current_fiscal_year(self, year: int) -> FiscalYear:
        """Establecer año fiscal actual."""
        fiscal_year = self.get_fiscal_year_by_year(year)
        if not fiscal_year:
            raise ValueError(f"Año fiscal {year} no encontrado")
        
        # Desactivar otros años fiscales actuales
        self.db.query(FiscalYear).update({"is_current": False})
        
        # Activar año fiscal seleccionado
        fiscal_year.is_current = True
        
        self.db.commit()
        self.db.refresh(fiscal_year)
        
        return fiscal_year
    
    def format_currency(self, amount: float) -> str:
        """Formatear cantidad como moneda."""
        currency_config = self.get_currency_settings()
        
        # Aplicar formato de números
        formatted_amount = self.format_number(amount, currency_config["decimals"])
        
        # Agregar símbolo de moneda
        if currency_config["position"] == "before":
            return f"{currency_config['symbol']} {formatted_amount}"
        else:
            return f"{formatted_amount} {currency_config['symbol']}"
    
    def format_number(self, number: float, decimal_places: int = None) -> str:
        """Formatear número según configuración del sistema."""
        format_config = self.get_number_format_settings()
        
        if decimal_places is None:
            decimal_places = format_config["decimal_places"]
        
        # Formatear número
        formatted = f"{number:,.{decimal_places}f}"
        
        # Aplicar separadores personalizados
        thousands_sep = format_config["thousands_separator"]
        decimal_sep = format_config["decimal_separator"]
        
        if thousands_sep != "," or decimal_sep != ".":
            # Reemplazar separadores por defecto con los personalizados
            parts = formatted.split(".")
            integer_part = parts[0].replace(",", thousands_sep)
            
            if len(parts) > 1:
                return f"{integer_part}{decimal_sep}{parts[1]}"
            else:
                return integer_part
        
        return formatted
    
    def get_backup_settings(self) -> Dict[str, Any]:
        """Obtener configuraciones de backup."""
        return self.get_setting_value("backup_settings", {
            "daily_backup": True,
            "backup_time": "02:00",
            "retention_days": 30,
            "backup_path": "/backups"
        })
    
    def set_backup_settings(self, backup_config: Dict[str, Any]) -> SystemSettings:
        """Establecer configuraciones de backup."""
        return self.set_setting(
            key="backup_settings",
            value=backup_config,
            description="Configuraciones de backup automático",
            category="backup"
        )
    
    def create_backup_log(self, backup_type: str, file_path: str, status: str = "in_progress") -> BackupLog:
        """Crear log de backup."""
        backup_log = BackupLog(
            backup_type=backup_type,
            file_path=file_path,
            status=status
        )
        
        self.db.add(backup_log)
        self.db.commit()
        self.db.refresh(backup_log)
        
        return backup_log
    
    def update_backup_log(self, backup_log_id: int, status: str, file_size: int = None, error_message: str = None) -> BackupLog:
        """Actualizar log de backup."""
        backup_log = self.db.query(BackupLog).filter(BackupLog.id == backup_log_id).first()
        if not backup_log:
            raise ValueError("Log de backup no encontrado")
        
        backup_log.status = status
        backup_log.completed_at = datetime.utcnow()
        
        if file_size is not None:
            backup_log.file_size = file_size
        
        if error_message:
            backup_log.error_message = error_message
        
        self.db.commit()
        self.db.refresh(backup_log)
        
        return backup_log
    
    def get_backup_logs(self, limit: int = 50) -> List[BackupLog]:
        """Obtener logs de backup."""
        return self.db.query(BackupLog).order_by(BackupLog.started_at.desc()).limit(limit).all()
    
    def perform_backup(self) -> BackupLog:
        """Realizar backup manual."""
        backup_settings = self.get_backup_settings()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"opendoors_backup_{timestamp}.sql"
        backup_path = os.path.join(backup_settings.get("backup_path", "/backups"), backup_filename)
        
        # Crear log de backup
        backup_log = self.create_backup_log("manual", backup_path, "in_progress")
        
        try:
            # Comando de backup de PostgreSQL
            db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/opendoors")
            
            # Extraer componentes de la URL
            # postgresql://user:password@host:port/database
            parts = db_url.replace("postgresql://", "").split("/")
            db_name = parts[1]
            auth_parts = parts[0].split("@")
            user_pass = auth_parts[0].split(":")
            user = user_pass[0]
            password = user_pass[1] if len(user_pass) > 1 else ""
            host_port = auth_parts[1].split(":")
            host = host_port[0]
            port = host_port[1] if len(host_port) > 1 else "5432"
            
            # Comando pg_dump
            cmd = [
                "pg_dump",
                f"--host={host}",
                f"--port={port}",
                f"--username={user}",
                f"--dbname={db_name}",
                "--no-password",
                "--verbose",
                "--clean",
                "--no-owner",
                "--no-privileges",
                f"--file={backup_path}"
            ]
            
            # Establecer variable de entorno para contraseña
            env = os.environ.copy()
            if password:
                env["PGPASSWORD"] = password
            
            # Ejecutar backup
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Backup exitoso
                file_size = os.path.getsize(backup_path) if os.path.exists(backup_path) else 0
                self.update_backup_log(backup_log.id, "success", file_size)
            else:
                # Backup falló
                error_message = result.stderr or "Error desconocido en el backup"
                self.update_backup_log(backup_log.id, "failed", error_message=error_message)
                
        except Exception as e:
            # Error en el proceso de backup
            self.update_backup_log(backup_log.id, "failed", error_message=str(e))
        
        return backup_log
    
    def get_ui_settings(self) -> Dict[str, Any]:
        """Obtener configuraciones de interfaz."""
        return self.get_setting_value("ui_settings", {
            "theme": "light",
            "language": "es",
            "timezone": "America/Argentina/Buenos_Aires"
        })
    
    def set_ui_settings(self, ui_config: Dict[str, Any]) -> SystemSettings:
        """Establecer configuraciones de interfaz."""
        return self.set_setting(
            key="ui_settings",
            value=ui_config,
            description="Configuraciones de interfaz de usuario",
            category="ui"
        )
