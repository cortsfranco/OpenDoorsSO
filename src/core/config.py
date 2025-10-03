"""
Configuración central de la aplicación.
Maneja variables de entorno y configuraciones globales.
"""

import os
from typing import List
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()


class Settings:
    """
    Clase para gestionar todas las configuraciones y credenciales de la aplicación.
    Lee las variables desde el entorno, permitiendo una configuración flexible
    tanto para desarrollo (con .env) como para producción.
    """
    
    # Configuración del Proyecto
    PROJECT_NAME: str = "Sistema de Gestión Open Doors"
    API_V1_STR: str = "/api/v1"
    APP_NAME: str = "Open Doors"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Configuración de Seguridad (JWT)
    # IMPORTANTE: Esta clave debe ser secreta y compleja en producción.
    # Se puede generar con: openssl rand -hex 32
    SECRET_KEY: str = os.getenv("SECRET_KEY", "un_valor_secreto_por_defecto")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 días por defecto
    
    # Configuración de la Base de Datos (PostgreSQL)
    # Priorizar DATABASE_URL de Replit si existe, sino construir desde partes
    _DATABASE_URL_ENV: str = os.getenv("DATABASE_URL", "")
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "opendoors_db")
    
    @property
    def DATABASE_URL(self) -> str:
        if self._DATABASE_URL_ENV:
            return self._DATABASE_URL_ENV
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        base_url = self.DATABASE_URL
        if base_url.startswith("postgresql://"):
            base_url = base_url.replace("postgresql://", "postgresql+asyncpg://")
            if "?sslmode=" in base_url:
                base_url = base_url.split("?sslmode=")[0] + "?ssl=require"
        return base_url
    
    # CORS
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173").split(",")
    
    # ====== Credenciales de Azure OpenAI ======
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    OPENAI_API_VERSION: str = os.getenv("OPENAI_API_VERSION", "2024-02-01")

    # ====== Credenciales de Azure Document Intelligence ======
    AZURE_DOC_INTELLIGENCE_ENDPOINT: str = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT", "")
    AZURE_DOC_INTELLIGENCE_KEY: str = os.getenv("AZURE_DOC_INTELLIGENCE_KEY", "")

    # ====== Credenciales de Azure Cognitive Search ======
    AZURE_SEARCH_ENDPOINT: str = os.getenv("AZURE_SEARCH_ENDPOINT", "")
    AZURE_SEARCH_ADMIN_KEY: str = os.getenv("AZURE_SEARCH_ADMIN_KEY", "")
    AZURE_SEARCH_INDEX_NAME: str = os.getenv("AZURE_SEARCH_INDEX_NAME", "opendoors-invoices")

    # ====== Credenciales de Azure Storage (Blob) ======
    AZURE_STORAGE_ACCOUNT_NAME: str = os.getenv("AZURE_STORAGE_ACCOUNT_NAME", "")
    AZURE_STORAGE_ACCOUNT_KEY: str = os.getenv("AZURE_STORAGE_ACCOUNT_KEY", "")
    AZURE_STORAGE_CONTAINER_NAME: str = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "invoices")  # Contenedor para facturas
    
    # AFIP
    AFIP_TAX_ID: str = os.getenv("AFIP_TAX_ID", "")
    AFIP_CERTIFICATE_PATH: str = os.getenv("AFIP_CERTIFICATE_PATH", "")
    AFIP_PRIVATE_KEY_PATH: str = os.getenv("AFIP_PRIVATE_KEY_PATH", "")


# Crear una instancia de la configuración para ser importada en otros módulos
settings = Settings()
