from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.fiscal_settings import FiscalSettings
from typing import Dict, Any, List

class FiscalYearService:
    """Servicio para manejo de año fiscal argentino."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_fiscal_settings(self) -> FiscalSettings:
        """Obtener configuración fiscal actual."""
        result = await self.session.execute(
            select(FiscalSettings).order_by(FiscalSettings.id.desc()).limit(1)
        )
        settings = result.scalar_one_or_none()
        if not settings:
            # Si no hay configuración, crear una por defecto
            default_settings = FiscalSettings()
            self.session.add(default_settings)
            await self.session.commit()
            await self.session.refresh(default_settings)
            return default_settings
        return settings
    
    async def get_current_fiscal_year(self) -> Dict[str, Any]:
        """
        Determinar el año fiscal actual.
        
        Ejemplo: Si estamos en Marzo 2025 → Año Fiscal 2024 (Mayo 2024 - Abril 2025)
        Ejemplo: Si estamos en Mayo 2025 → Año Fiscal 2025 (Mayo 2025 - Abril 2026)
        """
        settings = await self.get_fiscal_settings()
        today = datetime.now().date()
        
        fiscal_start_month = settings.fiscal_year_start_month
        
        if today.month >= fiscal_start_month:
            fiscal_year = today.year
        else:
            fiscal_year = today.year - 1
        
        start_date = date(fiscal_year, fiscal_start_month, 1)
        end_date = start_date + relativedelta(years=1, days=-1)
        
        return {
            'year': fiscal_year,
            'start_date': start_date,
            'end_date': end_date,
            'label': f"{fiscal_year} (Mayo {fiscal_year} - Abril {fiscal_year + 1})",
            'current': True
        }
    
    async def get_fiscal_year_range(self, fiscal_year: int) -> Dict[str, Any]:
        """Obtener rango de fechas de un año fiscal específico."""
        settings = await self.get_fiscal_settings()
        
        start_date = date(fiscal_year, settings.fiscal_year_start_month, 1)
        end_date = start_date + relativedelta(years=1, days=-1)
        
        return {
            'year': fiscal_year,
            'start_date': start_date,
            'end_date': end_date,
            'label': f"{fiscal_year} (Mayo {fiscal_year} - Abril {fiscal_year + 1})"
        }
    
    async def get_fiscal_years_list(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Obtener lista de años fiscales disponibles."""
        current_fy = await self.get_current_fiscal_year()
        current_year = current_fy['year']
        
        fiscal_years = []
        
        for i in range(limit):
            fy = current_year - i
            fy_data = await self.get_fiscal_year_range(fy)
            fy_data['current'] = (fy == current_year)
            fiscal_years.append(fy_data)
        
        return fiscal_years