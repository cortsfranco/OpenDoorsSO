#!/bin/bash

# --- Script para detener el entorno de desarrollo de Open Doors ---
# Este script detiene todos los contenedores de manera segura.

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}   Deteniendo Entorno de Desarrollo Open Doors${NC}"
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

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no parece estar en ejecución."
    echo "No hay contenedores que detener."
    echo
    exit 1
fi

print_info "Deteniendo todos los servicios..."
echo

# Detener contenedores
if docker-compose down; then
    echo
    print_success "¡Servicios detenidos correctamente!"
    echo
    echo "Los contenedores han sido detenidos y eliminados."
    echo "Los datos de la base de datos se mantienen en el volumen."
    echo
    echo "Para iniciar nuevamente:"
    echo "  ./start-dev.sh"
else
    print_error "Error al detener los servicios."
    echo "Revisa los mensajes de error para más detalles."
    exit 1
fi

echo
print_info "Presiona Enter para continuar..."
read
