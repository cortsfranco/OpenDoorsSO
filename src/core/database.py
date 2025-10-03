"""
Configuración de la base de datos y sesiones SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from src.core.config import settings
from src.models.base import Base


# Crear motor asíncrono de SQLAlchemy
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={"ssl": "require"} if "ssl=require" in settings.ASYNC_DATABASE_URL else {}
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
        # Importar todos los modelos aquí para que se registren en Base
        from src.models import user, invoice, partner, system_settings, activity_log  # noqa
        
        print("🔧 Creando tablas en la base de datos...")
        # Crear todas las tablas usando Base de SQLAlchemy
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas exitosamente")
