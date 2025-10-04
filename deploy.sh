#!/bin/bash
# Script de deployment para Open Doors Billing

echo "🚀 Iniciando deployment de Open Doors Billing..."

# 1. Cargar variables de entorno
echo "📋 Cargando variables de entorno..."
if [ -f .env ]; then
    source .env
    echo "✅ Variables de entorno cargadas"
else
    echo "⚠️  Archivo .env no encontrado, usando valores por defecto"
fi

# 2. Verificar que Docker esté corriendo
echo "🐳 Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker Desktop"
    exit 1
fi
echo "✅ Docker está corriendo"

# 3. Construir imágenes Docker
echo "🔨 Construyendo imágenes Docker..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Imágenes construidas exitosamente"
else
    echo "❌ Error construyendo imágenes"
    exit 1
fi

# 4. Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# 5. Iniciar servicios
echo "✅ Iniciando servicios..."
docker-compose up -d

# 6. Esperar a que la DB esté lista
echo "⏳ Esperando PostgreSQL..."
sleep 15

# 7. Verificar que los servicios estén corriendo
echo "🔍 Verificando estado de servicios..."
docker-compose ps

# 8. Ejecutar migraciones
echo "📊 Ejecutando migraciones..."
docker-compose exec backend python -c "
import asyncio
from src.core.database import init_db
asyncio.run(init_db())
print('✅ Tablas creadas')
"

# 9. Crear superadmin si no existe
echo "👤 Verificando superadmin..."
docker-compose exec backend python -c "
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select
from src.core.database import engine
from src.models.user import User, UserRole
from src.core.security import get_password_hash

async def ensure_superadmin():
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        query = select(User).where(User.email == 'cortsfranco@hotmail.com')
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            superadmin = User(
                email='cortsfranco@hotmail.com',
                hashed_password=get_password_hash('Ncc1701E@'),
                full_name='Franco Corts',
                role=UserRole.SUPERADMIN,
                is_active=True
            )
            session.add(superadmin)
            await session.commit()
            print('✅ Superadmin Franco creado')
        else:
            print('✅ Superadmin ya existe')

asyncio.run(ensure_superadmin())
"

# 10. Ejecutar tests básicos
echo "🧪 Ejecutando tests básicos..."
python test_system.py

echo ""
echo "✅ Deployment completado!"
echo "🌐 Backend: http://localhost:5000"
echo "📚 Docs: http://localhost:5000/docs"
echo "🗄️  Base de datos: PostgreSQL en puerto 5432"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para detener: docker-compose down"
echo ""
echo "🎉 ¡Sistema Open Doors Billing listo para usar!"
