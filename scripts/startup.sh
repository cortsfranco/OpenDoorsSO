#!/bin/bash

# ============================================
# OPEN DOORS - Script de Inicio Automático
# ============================================
# Este script inicia todo el sistema Docker y auto-repara errores comunes

set -e

echo "🚀 Iniciando Sistema Open Doors..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar que Docker esté corriendo
log_info "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi
log_success "Docker está corriendo"

# 2. Verificar archivo .env
log_info "Verificando archivo .env..."
if [ ! -f ".env" ]; then
    log_warning "Archivo .env no encontrado. Creando desde .env.example..."
    cp .env.example .env
    log_warning "⚠️  IMPORTANTE: Edita .env y agrega tus credenciales de Azure antes de continuar"
    log_warning "Presiona ENTER cuando hayas configurado el archivo .env..."
    read -r
fi
log_success "Archivo .env encontrado"

# 3. Verificar SECRET_KEY en .env
log_info "Verificando SECRET_KEY..."
if grep -q "CAMBIAR_ESTO_CON_VALOR_GENERADO\|tu_clave_secreta_cambiar_aqui" .env 2>/dev/null; then
    log_warning "Generando SECRET_KEY automáticamente..."
    
    # Intentar con openssl, sino usar alternativa
    if command -v openssl &> /dev/null; then
        SECRET_KEY=$(openssl rand -hex 32)
    else
        # Alternativa para Windows sin openssl
        SECRET_KEY=$(cat /dev/urandom 2>/dev/null | tr -dc 'a-f0-9' | fold -w 64 | head -n 1 || echo "$(date +%s)$(echo $RANDOM)$(hostname)" | md5sum | cut -d' ' -f1)
    fi
    
    # Sed compatible con Mac y Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    else
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    fi
    log_success "SECRET_KEY generado: ${SECRET_KEY:0:20}..."
fi

# 4. Detener contenedores anteriores
log_info "Limpiando contenedores anteriores..."
docker-compose down -v 2>/dev/null || true
log_success "Contenedores anteriores detenidos"

# 5. Construir imágenes
log_info "Construyendo imágenes Docker..."
docker-compose build
log_success "Imágenes construidas"

# 6. Iniciar servicios
log_info "Iniciando servicios..."
docker-compose up -d
log_success "Servicios iniciados"

# 7. Cargar variables de entorno
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER_VAR="${POSTGRES_USER:-opendoors_user}"
POSTGRES_DB_VAR="${POSTGRES_DB:-opendoors_db}"

# 7. Esperar a que la base de datos esté lista
log_info "Esperando a que la base de datos esté lista..."
sleep 5
MAX_RETRIES=30
RETRIES=0
until docker-compose exec -T db pg_isready -U "$POSTGRES_USER_VAR" -d "$POSTGRES_DB_VAR" > /dev/null 2>&1; do
    RETRIES=$((RETRIES+1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
        log_error "La base de datos no respondió a tiempo"
        docker-compose logs db
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
log_success "Base de datos lista"

# 8. Ejecutar migraciones
log_info "Ejecutando migraciones de base de datos..."
docker-compose exec -T backend python -c "
import asyncio
from src.core.database import init_db

async def run():
    try:
        await init_db()
        print('✅ Migraciones completadas')
    except Exception as e:
        print(f'❌ Error en migraciones: {e}')
        exit(1)

asyncio.run(run())
" || {
    log_error "Error ejecutando migraciones"
    docker-compose logs backend
    exit 1
}

# 9. Crear superusuario si no existe
log_info "Verificando superusuario..."
SUPERADMIN_EMAIL="${SUPERADMIN_EMAIL:-cortsfranco@hotmail.com}"
SUPERADMIN_PASSWORD="${SUPERADMIN_PASSWORD:-Ncc1701E@}"

docker-compose exec -T backend python -c "
import asyncio
import os
from sqlalchemy import select
from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.core.security import get_password_hash

async def create_superuser():
    email = os.getenv('SUPERADMIN_EMAIL', 'cortsfranco@hotmail.com')
    password = os.getenv('SUPERADMIN_PASSWORD', 'Ncc1701E@')
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name='Franco Corts',
                role='SUPERADMIN',
                is_active=True
            )
            session.add(user)
            await session.commit()
            print(f'✅ Superusuario creado: {email}')
        else:
            print('ℹ️  Superusuario ya existe')

asyncio.run(create_superuser())
" || log_warning "No se pudo verificar/crear superusuario (puede que ya exista)"

# 10. Verificar salud del backend
log_info "Verificando salud del backend..."
sleep 3
MAX_RETRIES=20
RETRIES=0
until curl -f http://localhost:8000/health > /dev/null 2>&1; do
    RETRIES=$((RETRIES+1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
        log_error "Backend no respondió a tiempo"
        docker-compose logs backend
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
log_success "Backend está saludable"

# 11. Verificar frontend
log_info "Verificando frontend..."
sleep 2
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    log_success "Frontend está corriendo"
else
    log_warning "Frontend puede tardar unos segundos en estar listo..."
fi

# 12. Mostrar información final
echo ""
echo "================================================"
log_success "🎉 Sistema Open Doors iniciado exitosamente!"
echo "================================================"
echo ""
echo "📊 Servicios disponibles:"
echo ""
echo "   🌐 Frontend:        http://localhost:5000"
echo "   🔧 Backend API:     http://localhost:8000"
echo "   📖 API Docs:        http://localhost:8000/docs"
echo "   🗄️  PostgreSQL:      localhost:5432"
echo "   🐘 pgAdmin:         http://localhost:5050"
echo "      - Email:    admin@opendoors.com"
echo "      - Password: admin"
echo ""
echo "👤 Credenciales de acceso:"
echo ""
echo "   📧 Email:    cortsfranco@hotmail.com"
echo "   🔑 Password: Ncc1701E@"
echo ""
echo "================================================"
echo ""
echo "📝 Comandos útiles:"
echo ""
echo "   Ver logs:           docker-compose logs -f"
echo "   Detener sistema:    docker-compose down"
echo "   Reiniciar:          docker-compose restart"
echo "   Exportar BD:        ./scripts/export_hostinger.sh"
echo ""
echo "================================================"

# 13. Función de auto-reparación continua
auto_repair_daemon() {
    local CHECK_INTERVAL=30
    local ERROR_COUNT=0
    
    while true; do
        sleep $CHECK_INTERVAL
        
        # Verificar errores de JWT
        if docker-compose logs --tail=50 backend 2>/dev/null | grep -qi "secret.*key.*error\|jwt.*error"; then
            log_warning "Detectado error de JWT/SECRET_KEY, regenerando..."
            
            if command -v openssl &> /dev/null; then
                SECRET_KEY=$(openssl rand -hex 32)
            else
                SECRET_KEY=$(cat /dev/urandom 2>/dev/null | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)
            fi
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
            else
                sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
            fi
            
            docker-compose restart backend
            log_success "Backend reiniciado con nuevo SECRET_KEY"
            ERROR_COUNT=$((ERROR_COUNT+1))
        fi
        
        # Verificar errores de conexión a BD
        if docker-compose logs --tail=50 backend 2>/dev/null | grep -qi "database.*connection.*error\|asyncpg.*error"; then
            log_warning "Detectado error de conexión a BD, reiniciando servicios..."
            docker-compose restart db backend
            sleep 10
            log_success "Servicios de BD reiniciados"
            ERROR_COUNT=$((ERROR_COUNT+1))
        fi
        
        # Verificar errores de migración
        if docker-compose logs --tail=50 backend 2>/dev/null | grep -qi "migration.*failed\|alembic.*error"; then
            log_warning "Detectado error de migración, forzando re-creación..."
            docker-compose exec -T backend python -c "
import asyncio
from src.core.database import init_db
asyncio.run(init_db())
" 2>/dev/null || log_error "No se pudo forzar migración"
            docker-compose restart backend
            ERROR_COUNT=$((ERROR_COUNT+1))
        fi
        
        # Si hay muchos errores, detener auto-reparación
        if [ $ERROR_COUNT -ge 5 ]; then
            log_error "Demasiados errores detectados ($ERROR_COUNT), deteniendo auto-reparación"
            log_error "Revisa los logs: docker-compose logs"
            break
        fi
    done
}

# Iniciar daemon de auto-reparación en background
log_info "Iniciando daemon de auto-reparación..."
auto_repair_daemon &
REPAIR_PID=$!

# Trap para limpiar al salir
cleanup() {
    echo ""
    log_info "Deteniendo auto-reparación..."
    kill $REPAIR_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Mostrar logs en tiempo real
log_info "Mostrando logs en tiempo real (Ctrl+C para salir)..."
log_info "Daemon de auto-reparación activo en background (PID: $REPAIR_PID)"
echo ""
docker-compose logs -f
