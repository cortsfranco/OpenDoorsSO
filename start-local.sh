#!/bin/bash
# Script para iniciar el sistema Open Doors en desarrollo local

echo "🚀 Iniciando Open Doors - Sistema de Gestión Empresarial"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Verificando dependencias...${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    exit 1
fi
echo "✅ Python encontrado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo "✅ Node.js encontrado"

# Verificar dependencias de Python
echo -e "\n${BLUE}📚 Instalando dependencias de Python...${NC}"
pip install -q -r requirements.txt
echo "✅ Dependencias de Python instaladas"

# Verificar dependencias de Node
if [ ! -d "frontend/node_modules" ]; then
    echo -e "\n${BLUE}📚 Instalando dependencias de Node.js...${NC}"
    cd frontend && npm install && cd ..
    echo "✅ Dependencias de Node.js instaladas"
fi

# Iniciar backend en background
echo -e "\n${GREEN}🔧 Iniciando Backend (puerto 5000)...${NC}"
uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Esperar a que el backend esté listo
sleep 3

# Iniciar frontend en background
echo -e "\n${GREEN}🎨 Iniciando Frontend (puerto 3000)...${NC}"
cd frontend && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

# Información final
echo -e "\n${GREEN}✅ Sistema iniciado correctamente!${NC}"
echo ""
echo "📍 URLs disponibles:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:5000"
echo "   • Documentación API: http://localhost:5000/docs"
echo ""
echo "🔑 Credenciales de acceso:"
echo "   Email: cortsfranco@hotmail.com"
echo "   Password: Ncc1701E@"
echo ""
echo "📝 Logs:"
echo "   • Backend: tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""
echo "⏹️  Para detener: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "💡 Tip: Abre http://localhost:3000 en tu navegador"

# Guardar PIDs para poder detenerlos después
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
