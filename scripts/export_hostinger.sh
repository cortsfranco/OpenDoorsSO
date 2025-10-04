#!/bin/bash

# ============================================
# OPEN DOORS - Exportar Base de Datos a Hostinger Cloud
# ============================================
# Este script exporta la BD local de Docker para migrarla a Hostinger

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "📦 Exportando Base de Datos Open Doors"
echo "================================================"

# 1. Verificar que Docker esté corriendo
log_info "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker no está corriendo"
    exit 1
fi

# 2. Verificar que el contenedor de BD exista
log_info "Verificando contenedor de base de datos..."
if ! docker-compose ps | grep -q opendoors_db; then
    log_error "El contenedor opendoors_db no está corriendo"
    log_info "Ejecuta primero: ./scripts/startup.sh"
    exit 1
fi

# 3. Crear directorio de exportación
EXPORT_DIR="exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${EXPORT_DIR}/opendoors_backup_${TIMESTAMP}.sql"

mkdir -p "$EXPORT_DIR"

# 4. Cargar variables de entorno
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER_VAR="${POSTGRES_USER:-opendoors_user}"
POSTGRES_PASSWORD_VAR="${POSTGRES_PASSWORD:-opendoors_password}"
POSTGRES_DB_VAR="${POSTGRES_DB:-opendoors_db}"

# 4. Exportar schema y datos
log_info "Exportando base de datos completa..."
docker-compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD_VAR" db pg_dump \
    -U "$POSTGRES_USER_VAR" \
    -d "$POSTGRES_DB_VAR" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    > "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    log_success "Base de datos exportada: $EXPORT_FILE"
else
    log_error "Error al exportar base de datos"
    exit 1
fi

# 5. Crear archivo comprimido
log_info "Comprimiendo archivo..."
gzip -f "$EXPORT_FILE"
COMPRESSED_FILE="${EXPORT_FILE}.gz"

if [ -f "$COMPRESSED_FILE" ]; then
    FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log_success "Archivo comprimido: $COMPRESSED_FILE ($FILE_SIZE)"
else
    log_error "Error al comprimir archivo"
    exit 1
fi

# 6. Exportar solo schema (sin datos) - útil para setup inicial
SCHEMA_FILE="${EXPORT_DIR}/opendoors_schema_${TIMESTAMP}.sql"
log_info "Exportando solo schema (sin datos)..."
docker-compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD_VAR" db pg_dump \
    -U "$POSTGRES_USER_VAR" \
    -d "$POSTGRES_DB_VAR" \
    --schema-only \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    > "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    log_success "Schema exportado: $SCHEMA_FILE"
else
    log_warning "No se pudo exportar el schema"
fi

# 7. Crear archivo de instrucciones para Hostinger
INSTRUCTIONS_FILE="${EXPORT_DIR}/INSTRUCCIONES_HOSTINGER_${TIMESTAMP}.txt"
cat > "$INSTRUCTIONS_FILE" << 'EOF'
============================================
INSTRUCCIONES PARA MIGRAR A HOSTINGER CLOUD
============================================

OPCIÓN 1: Importar base de datos completa (con datos)
------------------------------------------------------
1. Descomprimir archivo .sql.gz:
   gunzip opendoors_backup_*.sql.gz

2. Conectar a Hostinger PostgreSQL:
   psql -h <hostinger_host> -U <hostinger_user> -d <hostinger_db>

3. Importar datos:
   psql -h <hostinger_host> -U <hostinger_user> -d <hostinger_db> < opendoors_backup_*.sql

OPCIÓN 2: Importar solo schema (setup inicial)
-----------------------------------------------
1. Conectar a Hostinger PostgreSQL:
   psql -h <hostinger_host> -U <hostinger_user> -d <hostinger_db>

2. Importar schema:
   psql -h <hostinger_host> -U <hostinger_user> -d <hostinger_db> < opendoors_schema_*.sql

OPCIÓN 3: Desde pgAdmin (interfaz gráfica)
-------------------------------------------
1. Abrir pgAdmin en http://localhost:5050
   - Email: admin@opendoors.com
   - Password: admin

2. Conectar a servidor Hostinger:
   - Host: <hostinger_host>
   - Port: 5432 (usualmente)
   - Database: <hostinger_db>
   - Username: <hostinger_user>
   - Password: <hostinger_password>

3. Click derecho en la base de datos → Restore
4. Seleccionar el archivo .sql o .sql.gz

CONFIGURAR BACKEND PARA HOSTINGER
----------------------------------
Actualizar archivo .env con credenciales de Hostinger:

POSTGRES_USER=<hostinger_user>
POSTGRES_PASSWORD=<hostinger_password>
POSTGRES_SERVER=<hostinger_host>
POSTGRES_PORT=5432
POSTGRES_DB=<hostinger_db>
DATABASE_URL=postgresql://<hostinger_user>:<hostinger_password>@<hostinger_host>:5432/<hostinger_db>

VERIFICAR MIGRACIÓN
-------------------
1. Reiniciar backend:
   docker-compose restart backend

2. Verificar conexión:
   curl http://localhost:8000/health

3. Probar login:
   Email: cortsfranco@hotmail.com
   Password: Ncc1701E@

TROUBLESHOOTING
---------------
- Si hay error de SSL, agregar a DATABASE_URL:
  ?sslmode=require
  
- Si hay error de encoding:
  Asegurarse que la BD use UTF8:
  CREATE DATABASE opendoors_db ENCODING 'UTF8';

- Si faltan extensiones:
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

log_success "Instrucciones creadas: $INSTRUCTIONS_FILE"

# 8. Resumen final
echo ""
echo "================================================"
log_success "🎉 Exportación completada exitosamente!"
echo "================================================"
echo ""
echo "📁 Archivos generados:"
echo ""
echo "   💾 Backup completo:  $COMPRESSED_FILE ($FILE_SIZE)"
echo "   📋 Schema solo:      $SCHEMA_FILE"
echo "   📖 Instrucciones:    $INSTRUCTIONS_FILE"
echo ""
echo "================================================"
echo ""
echo "🚀 Próximos pasos para migrar a Hostinger:"
echo ""
echo "   1. Lee las instrucciones en:"
echo "      $INSTRUCTIONS_FILE"
echo ""
echo "   2. Obtén credenciales de Hostinger Cloud PostgreSQL"
echo ""
echo "   3. Importa el backup usando una de las 3 opciones"
echo ""
echo "   4. Actualiza .env con credenciales de Hostinger"
echo ""
echo "   5. Reinicia el backend: docker-compose restart backend"
echo ""
echo "================================================"
