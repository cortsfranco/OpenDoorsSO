#!/bin/bash
# Script para detener Open Doors completamente

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
echo -e "${RED}  ⏹️  OPEN DOORS - DETENIENDO SISTEMA${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}[1/3]${NC} 🛑 Deteniendo Backend (Puerto 5000)..."

# Leer PID del backend si existe
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "   ✅ Backend detenido (PID: $BACKEND_PID)"
    rm .backend.pid
fi

# Matar cualquier proceso uvicorn
pkill -f "uvicorn src.main:app" 2>/dev/null

# Liberar puerto 5000
PORT_PID=$(lsof -ti:5000 2>/dev/null || true)
if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
    echo "   → Puerto 5000 liberado"
fi

echo "   ✅ Backend detenido"
echo ""

echo -e "${GREEN}[2/3]${NC} 🛑 Deteniendo Frontend (Puerto 3000)..."

# Leer PID del frontend si existe
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "   ✅ Frontend detenido (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Matar cualquier proceso vite/npm
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Liberar puerto 3000
PORT_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
    echo "   → Puerto 3000 liberado"
fi

echo "   ✅ Frontend detenido"
echo ""

echo -e "${GREEN}[3/3]${NC} 🧹 Limpieza final..."
sleep 1
echo "   ✅ Limpieza completada"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ SISTEMA DETENIDO COMPLETAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Puedes cerrar esta ventana"
echo ""

sleep 2
