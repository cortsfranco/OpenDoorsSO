#!/bin/bash
# Script para iniciar Open Doors con Docker y manejo automático de errores
# Ejecutable con doble clic en Linux/Mac

set -e  # Detener si hay errores críticos

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir con formato
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${GREEN}[$1] $2${NC}"
}

print_success() {
    echo -e "   ${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "   ${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "   ${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "   ${CYAN}→ $1${NC}"
}

# ═══════════════════════════════════════════════════════════
# INICIO
# ═══════════════════════════════════════════════════════════
clear
print_header "🚀 OPEN DOORS - SISTEMA DE GESTIÓN EMPRESARIAL"

# ═══════════════════════════════════════════════════════════
# PASO 1: LIMPIAR PROCESOS ANTERIORES
# ═══════════════════════════════════════════════════════════
print_step "1/8" "🧹 Limpiando procesos anteriores..."

# Matar procesos de uvicorn y vite
pkill -f "uvicorn src.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# Esperar un momento
sleep 2

print_success "Procesos anteriores limpiados"

# ═══════════════════════════════════════════════════════════
# PASO 2: LIBERAR PUERTOS
# ═══════════════════════════════════════════════════════════
print_step "2/8" "🔓 Liberando puertos 5000, 3000 y 5432..."

# Función para liberar puerto
free_port() {
    PORT=$1
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        print_info "Puerto $PORT liberado (PID: $PID)"
    fi
}

free_port 5000
free_port 3000
free_port 5432

sleep 1
print_success "Puertos liberados"

# ═══════════════════════════════════════════════════════════
# PASO 3: VERIFICAR DOCKER
# ═══════════════════════════════════════════════════════════
print_step "3/8" "🐳 Verificando Docker..."

USE_DOCKER=0
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_info "$DOCKER_VERSION"
        print_success "Docker encontrado y corriendo"
        USE_DOCKER=1
    else
        print_warning "Docker instalado pero no está corriendo"
        print_info "El sistema usará base de datos remota (Neon)"
    fi
else
    print_warning "Docker no está instalado"
    print_info "El sistema usará base de datos remota (Neon)"
fi

# ═══════════════════════════════════════════════════════════
# PASO 4: REINICIAR BASE DE DATOS DOCKER (SI ESTÁ DISPONIBLE)
# ═══════════════════════════════════════════════════════════
if [ $USE_DOCKER -eq 1 ]; then
    print_step "4/8" "🗄️  Reiniciando base de datos PostgreSQL con Docker..."
    
    print_info "Deteniendo contenedores anteriores..."
    docker-compose down 2>/dev/null || true
    
    sleep 2
    
    print_info "Iniciando PostgreSQL..."
    docker-compose up -d 2>/dev/null || {
        print_warning "No se pudo iniciar Docker Compose"
        print_info "Continuando con base de datos remota"
        USE_DOCKER=0
    }
    
    if [ $USE_DOCKER -eq 1 ]; then
        print_info "Esperando 5 segundos para que la base de datos se inicie..."
        sleep 5
        print_success "Base de datos PostgreSQL iniciada"
    fi
else
    print_step "4/8" "🗄️  Base de datos..."
    print_info "Usando base de datos remota (Neon/Replit)"
    print_success "Configuración lista"
fi

# ═══════════════════════════════════════════════════════════
# PASO 5: VERIFICAR PYTHON
# ═══════════════════════════════════════════════════════════
print_step "5/8" "🐍 Verificando Python..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    echo "   📥 Instala Python desde: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
print_info "$PYTHON_VERSION"
print_success "Python encontrado"

# ═══════════════════════════════════════════════════════════
# PASO 6: VERIFICAR NODE.JS
# ═══════════════════════════════════════════════════════════
print_step "6/8" "📦 Verificando Node.js..."

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "   📥 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_info "Node.js $NODE_VERSION"
print_success "Node.js encontrado"

# ═══════════════════════════════════════════════════════════
# PASO 7: INSTALAR DEPENDENCIAS
# ═══════════════════════════════════════════════════════════
print_step "7/8" "📚 Instalando dependencias..."

# Instalar dependencias de Python
print_info "Instalando dependencias de Python..."
pip3 install -q -r requirements.txt 2>&1 | grep -v "Requirement already satisfied" || true

# Instalar dependencias de Node.js si no existen
if [ ! -d "frontend/node_modules" ]; then
    print_info "Instalando dependencias de Node.js (puede tomar unos minutos)..."
    cd frontend && npm install --silent && cd ..
else
    print_info "Dependencias de Node.js ya instaladas"
fi

print_success "Dependencias listas"

# ═══════════════════════════════════════════════════════════
# PASO 8: INICIAR SERVICIOS EN SIMULTÁNEO
# ═══════════════════════════════════════════════════════════
print_step "8/8" "🚀 Iniciando servicios en simultáneo..."

# Crear directorio de logs si no existe
mkdir -p logs

# Iniciar Backend
print_info "Iniciando Backend (Puerto 5000)..."
uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
echo "      Backend PID: $BACKEND_PID"

# Esperar 2 segundos
sleep 2

# Verificar que el backend esté corriendo
if ! ps -p $BACKEND_PID > /dev/null; then
    print_error "Error al iniciar el backend"
    echo "   Ver logs: tail -f logs/backend.log"
    exit 1
fi

# Iniciar Frontend
print_info "Iniciando Frontend (Puerto 3000)..."
cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > .frontend.pid
echo "      Frontend PID: $FRONTEND_PID"

# Esperar 5 segundos para sincronización
print_info "Esperando 5 segundos para sincronización..."
sleep 5

# Verificar que el frontend esté corriendo
if ! ps -p $FRONTEND_PID > /dev/null; then
    print_warning "El frontend puede no estar corriendo correctamente"
    echo "   Ver logs: tail -f logs/frontend.log"
fi

# ═══════════════════════════════════════════════════════════
# ÉXITO
# ═══════════════════════════════════════════════════════════
clear
print_header "✅ SISTEMA INICIADO CORRECTAMENTE"

if [ $USE_DOCKER -eq 1 ]; then
    echo -e "${CYAN}🐳 Docker:${NC}"
    echo "   • PostgreSQL:  Running en puerto 5432"
    echo ""
fi

echo -e "${GREEN}📍 URLs Disponibles:${NC}"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:5000"
echo "   • API Docs:  http://localhost:5000/docs"
echo ""

echo -e "${BLUE}🔑 Credenciales de Acceso:${NC}"
echo "   Email:    cortsfranco@hotmail.com"
echo "   Password: Ncc1701E@"
echo ""

echo -e "${YELLOW}📝 Logs en Tiempo Real:${NC}"
echo "   • Backend:  tail -f logs/backend.log"
echo "   • Frontend: tail -f logs/frontend.log"
echo ""

echo -e "${RED}⏹️  Para Detener:${NC}"
echo "   • Ejecuta: ./DETENER-OPENDOORS.sh"
echo "   • O ejecuta: kill $BACKEND_PID $FRONTEND_PID"
if [ $USE_DOCKER -eq 1 ]; then
    echo "   • Docker: docker-compose down"
fi
echo ""

print_header "Sistema Ejecutándose"

echo -e "${GREEN}💡 Abriendo navegador...${NC}\n"

# Intentar abrir el navegador automáticamente
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null &
else
    print_info "Abre manualmente: http://localhost:3000"
fi

sleep 2

echo ""
echo -e "${GREEN}✅ Todo listo! El sistema está funcionando${NC}"
echo ""
echo "Presiona Ctrl+C para ver los logs en tiempo real"
echo "O cierra esta ventana (el sistema seguirá ejecutándose en segundo plano)"
echo ""

# Mantener el script vivo y mostrar logs
trap "echo ''; echo 'Para detener el sistema ejecuta: ./DETENER-OPENDOORS.sh'; exit" INT

tail -f logs/backend.log logs/frontend.log
