"""
Configuración de la base de datos y sesiones SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator
from urllib.parse import urlparse, parse_qs
from src.core.config import settings
from src.models.base import Base


# Configurar connect_args con SSL seguro
connect_args_config = {
    "server_settings": {"jit": "off"},
    "command_timeout": 60,
    "timeout": 30
}

# Parsear URL para detectar configuración SSL explícita
parsed_url = urlparse(settings.ASYNC_DATABASE_URL)
query_params = parse_qs(parsed_url.query)

# Solo forzar SSL si NO hay ningún parámetro SSL explícito en la URL
has_ssl_config = (
    "ssl" in query_params or
    "sslmode" in query_params or
    "ssl=" in settings.ASYNC_DATABASE_URL.lower() or
    "sslmode=" in settings.ASYNC_DATABASE_URL.lower()
)

if not has_ssl_config:
    # Usar ssl=True para habilitar SSL con verificación predeterminada
    connect_args_config["ssl"] = True

# Crear motor asíncrono de SQLAlchemy con pool de conexiones
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args_config
)

# Crear factory de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obtener una sesión de base de datos.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Inicializa la base de datos creando todas las tablas.
    """
    async with engine.begin() as conn:
        # Importar todos los modelos aquí para que se registren en Base
        from src.models import user, invoice, partner, system_settings, activity_log  # noqa
        
        print("🔧 Creando tablas en la base de datos...")
        # Crear todas las tablas usando Base de SQLAlchemy
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas exitosamente")
