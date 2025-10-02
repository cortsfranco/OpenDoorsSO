#!/bin/bash

# --- Script para iniciar el entorno de desarrollo de Open Doors ---
# Este script levanta la base de datos, el backend y el frontend
# utilizando Docker Compose.

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}   Iniciando Entorno de Desarrollo Open Doors  ${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Limpiar pantalla y mostrar header
clear
print_header

# 1. Verificar si Docker está corriendo
print_info "Verificando que Docker esté en ejecución..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no parece estar en ejecución."
    echo "Por favor, inicia Docker y vuelve a intentarlo."
    echo
    exit 1
fi
print_success "Docker está activo."

# 2. Verificar si existe el archivo .env
if [ ! -f ".env" ]; then
    print_warning "No se encontró el archivo .env"
    echo "Creando copia desde env.example..."
    cp env.example .env
    echo
    print_warning "IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    echo "antes de continuar con el desarrollo."
    echo
    read -p "Presiona Enter para continuar..."
fi

# 3. Verificar si docker-compose está disponible
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "docker-compose no está instalado o no está en el PATH."
    echo "Por favor, instala docker-compose y vuelve a intentarlo."
    exit 1
fi

# 4. Levantar los contenedores
print_info "Levantando los servicios (backend, db, frontend)..."
echo "Esto puede tardar unos minutos la primera vez."
echo

if docker-compose up --build -d; then
    echo
    print_success "¡Entorno levantado con éxito!"
    echo
    echo "Puedes acceder a los siguientes servicios:"
    echo "-------------------------------------------------"
    echo -e "  ${GREEN}Frontend (React):   http://localhost:3000${NC}"
    echo -e "  ${GREEN}Backend (API Docs): http://localhost:8000/docs${NC}"
    echo -e "  ${GREEN}Base de Datos:      localhost:5432${NC}"
    echo "-------------------------------------------------"
    echo
    echo "Comandos útiles:"
    echo "  Ver logs en tiempo real: docker-compose logs -f"
    echo "  Detener servicios:       ./stop-dev.sh"
    echo "  Reiniciar un servicio:   docker-compose restart <service_name>"
    echo
    
    # Verificar estado de los servicios
    print_info "Verificando estado de los servicios..."
    sleep 5
    docker-compose ps
else
    print_error "Hubo un problema al levantar los contenedores."
    echo "Para ver los logs de error:"
    echo "  docker-compose logs"
    exit 1
fi

echo
print_info "Presiona Enter para continuar..."
read
