# 🚀 Sistema OpenDoors Billing

Sistema completo de facturación con lógica fiscal argentina para Open Doors.

## 📋 Scripts Disponibles

### 🎯 Inicio Rápido
```bash
# Iniciar todo el sistema (recomendado)
start_system.bat

# Solo modo desarrollo (sin abrir navegador)
dev_system.bat

# Detener todos los servicios
stop_system.bat

# Probar que todo funcione
test_system.bat
```

## 🔧 Requisitos

- **Node.js** (para el frontend)
- **Python 3.11+** (para el backend)
- **Git** (para control de versiones)

## 🚀 Instalación y Uso

### 1. Iniciar el Sistema Completo
```bash
# Ejecutar el script principal
start_system.bat
```

Este script:
- ✅ Detiene servicios anteriores
- ✅ Libera puertos 3000 y 5000
- ✅ Instala dependencias automáticamente
- ✅ Inicia backend en puerto 5000
- ✅ Inicia frontend en puerto 3000
- ✅ Abre el navegador automáticamente

### 2. Modo Desarrollo
```bash
# Solo iniciar servicios (sin abrir navegador)
dev_system.bat
```

### 3. Testing del Sistema
```bash
# Verificar que todo funcione
test_system.bat
```

### 4. Detener el Sistema
```bash
# Detener todos los servicios
stop_system.bat
```

## 🌐 URLs del Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Documentación API**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health

## 🔐 Credenciales de Prueba

- **Email**: cortsfranco@hotmail.com
- **Contraseña**: Ncc1701E@
- **Rol**: SUPERADMIN

## 📊 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Usuario actual

### Reportes Financieros
- `GET /api/v1/financial/balance-iva` - Balance IVA
- `GET /api/v1/financial/balance-general` - Balance General
- `GET /api/v1/financial/resumen-completo` - Resumen completo

### Gestión
- `GET /api/invoices` - Lista de facturas
- `GET /api/partners` - Lista de socios

## 🛠️ Estructura del Proyecto

```
OpenDoors SO/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── services/       # API calls
│   │   └── styles/         # CSS
│   └── package.json
├── src/                     # Backend Python
│   ├── main_simple.py      # Servidor principal
│   ├── models/             # Modelos de datos
│   ├── api/                # Endpoints
│   └── core/               # Configuración
├── start_system.bat        # Iniciar sistema
├── dev_system.bat          # Modo desarrollo
├── stop_system.bat         # Detener sistema
├── test_system.bat         # Testing
└── README_SISTEMA.md       # Esta documentación
```

## 🔧 Solución de Problemas

### Error 504 "Outdated Optimize Dep"
```bash
# Limpiar y reinstalar frontend
cd frontend
rm -rf node_modules .vite dist
npm install
npm run dev
```

### Puerto ocupado
```bash
# Liberar puertos manualmente
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /f /pid [PID]
```

### Dependencias faltantes
```bash
# Reinstalar dependencias backend
pip install fastapi uvicorn python-dotenv bcrypt email-validator asyncpg
```

## 📈 Próximos Pasos

1. **Base de datos**: Conectar con PostgreSQL
2. **Autenticación real**: Implementar JWT completo
3. **Datos reales**: Cargar facturas reales
4. **Azure AI**: Integrar procesamiento de documentos
5. **Deploy**: Preparar para producción

## 🎯 Características Implementadas

- ✅ **Frontend React** con Vite
- ✅ **Backend FastAPI** con endpoints básicos
- ✅ **Autenticación** con credenciales de prueba
- ✅ **Reportes financieros** con lógica fiscal argentina
- ✅ **Sistema de roles** jerárquico
- ✅ **Scripts de automatización** para desarrollo
- ✅ **Testing automático** del sistema

## 🚀 ¡Sistema Listo para Usar!

Ejecuta `start_system.bat` y comienza a trabajar con tu sistema de facturación OpenDoors.
