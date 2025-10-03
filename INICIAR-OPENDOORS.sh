#!/bin/bash
# Script para iniciar Open Doors con manejo automático de errores
# Ejecutable con doble clic en Linux/Mac

set -e  # Detener si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# ═══════════════════════════════════════════════════════════
# INICIO
# ═══════════════════════════════════════════════════════════
clear
print_header "🚀 OPEN DOORS - SISTEMA DE GESTIÓN EMPRESARIAL"

# ═══════════════════════════════════════════════════════════
# PASO 1: LIMPIAR PROCESOS ANTERIORES
# ═══════════════════════════════════════════════════════════
print_step "1/6" "🧹 Limpiando procesos anteriores..."

# Matar procesos de uvicorn y vite
pkill -f "uvicorn src.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Esperar un momento
sleep 2

print_success "Procesos anteriores limpiados"

# ═══════════════════════════════════════════════════════════
# PASO 2: LIBERAR PUERTOS
# ═══════════════════════════════════════════════════════════
print_step "2/6" "🔓 Liberando puertos 5000 y 3000..."

# Función para liberar puerto
free_port() {
    PORT=$1
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        echo "   → Puerto $PORT liberado (PID: $PID)"
    fi
}

free_port 5000
free_port 3000

sleep 1
print_success "Puertos liberados"

# ═══════════════════════════════════════════════════════════
# PASO 3: VERIFICAR PYTHON
# ═══════════════════════════════════════════════════════════
print_step "3/6" "🐍 Verificando Python..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    echo "   📥 Instala Python desde: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "   → $PYTHON_VERSION"
print_success "Python encontrado"

# ═══════════════════════════════════════════════════════════
# PASO 4: VERIFICAR NODE.JS
# ═══════════════════════════════════════════════════════════
print_step "4/6" "📦 Verificando Node.js..."

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "   📥 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "   → Node.js $NODE_VERSION"
print_success "Node.js encontrado"

# ═══════════════════════════════════════════════════════════
# PASO 5: INSTALAR DEPENDENCIAS
# ═══════════════════════════════════════════════════════════
print_step "5/6" "📚 Instalando dependencias..."

# Instalar dependencias de Python
echo "   → Instalando dependencias de Python..."
pip3 install -q -r requirements.txt 2>&1 | grep -v "Requirement already satisfied" || true

# Instalar dependencias de Node.js si no existen
if [ ! -d "frontend/node_modules" ]; then
    echo "   → Instalando dependencias de Node.js (puede tomar unos minutos)..."
    cd frontend && npm install --silent && cd ..
else
    echo "   → Dependencias de Node.js ya instaladas"
fi

print_success "Dependencias listas"

# ═══════════════════════════════════════════════════════════
# PASO 6: INICIAR SERVICIOS
# ═══════════════════════════════════════════════════════════
print_step "6/6" "🚀 Iniciando servicios..."

# Crear directorio de logs si no existe
mkdir -p logs

# Iniciar Backend
echo "   → Iniciando Backend (Puerto 5000)..."
uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
echo "      Backend PID: $BACKEND_PID"

# Esperar 3 segundos
sleep 3

# Verificar que el backend esté corriendo
if ! ps -p $BACKEND_PID > /dev/null; then
    print_error "Error al iniciar el backend"
    echo "   Ver logs: tail -f logs/backend.log"
    exit 1
fi

# Iniciar Frontend
echo "   → Iniciando Frontend (Puerto 3000)..."
cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > .frontend.pid
echo "      Frontend PID: $FRONTEND_PID"

# Esperar 5 segundos
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
echo ""

print_header "Sistema Ejecutándose"

echo -e "${GREEN}💡 Abriendo navegador...${NC}\n"

# Intentar abrir el navegador automáticamente
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null &
else
    echo "   → Abre manualmente: http://localhost:3000"
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
