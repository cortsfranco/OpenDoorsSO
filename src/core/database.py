"""
Configuración de la base de datos y sesiones SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from src.core.config import settings


# Crear motor asíncrono de SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    future=True
)

# Crear factory de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_session() -> AsyncSession:
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
        # Importar todos los modelos aquí para que SQLAlchemy los registre
        from src.models import user, invoice, partner, fiscal_settings  # noqa
        from src.models.base import Base
        
        # Crear todas las tablas
        await conn.run_sync(Base.metadata.create_all)
