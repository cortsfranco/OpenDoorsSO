# 🚀 Guía de Desarrollo - Open Doors

Esta guía te ayudará a configurar y ejecutar el entorno de desarrollo de Open Doors en tu máquina local.

## 📋 Prerrequisitos

### Requisitos del Sistema
- **Docker Desktop** (versión 4.0 o superior)
- **Git** para clonar el repositorio
- **Editor de código** (VS Code recomendado)

### Verificar Docker
Antes de comenzar, asegúrate de que Docker Desktop esté instalado y ejecutándose:

```bash
# Verificar que Docker esté funcionando
docker --version
docker-compose --version
```

## 🛠️ Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd opendoors-so
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración
cp env.example .env

# Editar el archivo .env con tus credenciales
# IMPORTANTE: Configura las credenciales de Azure y otros servicios
```

### 3. Configurar Credenciales de Azure
Edita el archivo `.env` y configura las siguientes variables:

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://tu-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=tu-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=tu-storage-account
AZURE_STORAGE_ACCOUNT_KEY=tu-storage-key
AZURE_STORAGE_CONTAINER_NAME=invoices

# Base de Datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password-segura
POSTGRES_DB=opendoors_db

# JWT
SECRET_KEY=tu-secret-key-super-segura
```

## 🚀 Iniciar el Entorno de Desarrollo

### Windows
```bash
# Método 1: Usar el script automatizado (Recomendado)
start-dev.bat

# Método 2: Comando manual
docker-compose up --build -d
```

### Linux/Mac
```bash
# Método 1: Usar el script automatizado (Recomendado)
./start-dev.sh

# Método 2: Comando manual
docker-compose up --build -d
```

### ¿Qué hace el script de inicio?
1. ✅ Verifica que Docker esté ejecutándose
2. ✅ Crea el archivo `.env` si no existe
3. ✅ Construye y levanta todos los servicios
4. ✅ Verifica el estado de los servicios
5. ✅ Muestra las URLs de acceso

## 🌐 Acceso a los Servicios

Una vez iniciado, puedes acceder a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz de usuario React |
| **Backend API** | http://localhost:8000 | API FastAPI |
| **Documentación API** | http://localhost:8000/docs | Swagger UI |
| **Base de Datos** | localhost:5432 | PostgreSQL |

## 🛠️ Comandos Útiles

### Gestión de Servicios

#### Windows
```bash
# Iniciar servicios
start-dev.bat

# Detener servicios
stop-dev.bat

# Reiniciar servicios
restart-dev.bat

# Ver logs en tiempo real
logs-dev.bat
```

#### Linux/Mac
```bash
# Iniciar servicios
./start-dev.sh

# Detener servicios
./stop-dev.sh

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f
```

### Comandos Docker Compose

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Ejecutar comandos en contenedores
docker-compose exec backend bash
docker-compose exec db psql -U postgres -d opendoors_db

# Reconstruir un servicio específico
docker-compose up --build backend

# Limpiar volúmenes (¡CUIDADO! Esto borra los datos)
docker-compose down -v
```

## 🔧 Desarrollo

### Estructura del Proyecto
```
opendoors-so/
├── src/                    # Backend FastAPI
│   ├── api/               # Routers de la API
│   ├── core/              # Configuración central
│   ├── domain/            # Lógica de negocio
│   ├── db/models/         # Modelos de base de datos
│   └── agents/            # Agentes de IA
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   └── contexts/      # Contextos de React
├── docker-compose.yml     # Configuración de servicios
├── start-dev.bat         # Script de inicio (Windows)
└── start-dev.sh          # Script de inicio (Linux/Mac)
```

### Hot Reload
- **Backend**: Los cambios se reflejan automáticamente
- **Frontend**: Los cambios se reflejan automáticamente
- **Base de Datos**: Persiste entre reinicios

### Debugging

#### Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Acceder a Contenedores
```bash
# Backend
docker-compose exec backend bash

# Base de datos
docker-compose exec db psql -U postgres -d opendoors_db
```

## 🐛 Solución de Problemas

### Problema: Docker no inicia
**Solución:**
1. Verifica que Docker Desktop esté ejecutándose
2. Reinicia Docker Desktop
3. Verifica que tengas permisos para ejecutar Docker

### Problema: Puerto ya en uso
**Solución:**
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Detener el proceso o cambiar puertos en docker-compose.yml
```

### Problema: Error de conexión a base de datos
**Solución:**
1. Verifica que el contenedor de DB esté ejecutándose: `docker-compose ps`
2. Verifica las credenciales en `.env`
3. Reinicia los servicios: `docker-compose restart`

### Problema: Frontend no carga
**Solución:**
1. Verifica que el contenedor frontend esté ejecutándose
2. Revisa los logs: `docker-compose logs frontend`
3. Verifica que no haya errores de compilación

### Problema: API no responde
**Solución:**
1. Verifica que el backend esté ejecutándose
2. Revisa los logs: `docker-compose logs backend`
3. Verifica la configuración de CORS
4. Verifica las variables de entorno

## 📝 Próximos Pasos

Una vez que tengas el entorno funcionando:

1. **Explora la API**: Visita http://localhost:8000/docs
2. **Prueba el Frontend**: Visita http://localhost:3000
3. **Lee la documentación**: Revisa los archivos README.md
4. **Contribuye**: Haz cambios y prueba nuevas funcionalidades

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa los logs**: `docker-compose logs`
2. **Verifica la configuración**: Archivo `.env`
3. **Consulta la documentación**: README.md y este archivo
4. **Contacta al equipo**: Para problemas específicos

---

**¡Feliz desarrollo! 🎉**
