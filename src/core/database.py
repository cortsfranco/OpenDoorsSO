"""
Configuración de la base de datos y sesiones SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
from src.core.config import settings


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
        # Importar todos los modelos aquí para que SQLModel los registre
        from src.models import user, invoice, partner  # noqa
        
        # Crear todas las tablas
        await conn.run_sync(SQLModel.metadata.create_all)
