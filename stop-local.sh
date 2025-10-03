#!/bin/bash
# Script para detener el sistema Open Doors

echo "⏹️  Deteniendo Open Doors..."

# Leer PIDs guardados
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend detenido (PID: $BACKEND_PID)"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend detenido (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Matar cualquier proceso uvicorn o vite que quede
pkill -f "uvicorn src.main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Sistema detenido completamente"
