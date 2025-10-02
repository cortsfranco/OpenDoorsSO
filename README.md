# Open Doors - Sistema de Gestión Empresarial

Sistema de gestión empresarial con inteligencia artificial para Open Doors, construido como un arquetipo reutilizable y escalable.

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura en capas robusta y desacoplada:

- **Backend**: FastAPI con Python, SQLModel/SQLAlchemy, PostgreSQL
- **Frontend**: React con TypeScript, Vite, shadcn/ui
- **IA**: LangGraph para orquestación de agentes, Azure OpenAI
- **Infraestructura**: Docker, GitHub Actions CI/CD, VPS Hostinger

## 🚀 Inicio Rápido

### Prerrequisitos

- **Docker Desktop** (versión 4.0 o superior)
- **Git** para clonar el repositorio

### Configuración Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd opendoors-so
   ```

2. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   # Editar .env con tus credenciales de Azure y configuración local
   ```

3. **Iniciar el entorno de desarrollo**

   **Windows:**
   ```bash
   start-dev.bat
   ```

   **Linux/Mac:**
   ```bash
   ./start-dev.sh
   ```

   **O manualmente:**
   ```bash
   docker-compose up --build -d
   ```

4. **Acceder a la aplicación**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **Documentación API**: http://localhost:8000/docs
   - **Base de Datos**: localhost:5432

### Scripts de Desarrollo

| Comando | Windows | Linux/Mac | Descripción |
|---------|---------|-----------|-------------|
| **Iniciar** | `start-dev.bat` | `./start-dev.sh` | Levanta todos los servicios |
| **Detener** | `stop-dev.bat` | `./stop-dev.sh` | Detiene todos los servicios |
| **Reiniciar** | `restart-dev.bat` | `docker-compose restart` | Reinicia los servicios |
| **Ver Logs** | `logs-dev.bat` | `docker-compose logs -f` | Muestra logs en tiempo real |

> 📖 **Guía completa de desarrollo**: Ver [DESARROLLO.md](DESARROLLO.md) para instrucciones detalladas.

## 📁 Estructura del Proyecto

```
opendoors-so/
├── src/                          # Código fuente del backend
│   ├── api/                      # Routers de FastAPI
│   ├── core/                     # Configuración central
│   ├── db/models/                # Modelos SQLModel
│   ├── domain/                   # Lógica de negocio
│   ├── repositories/             # Patrón Repository
│   ├── agents/                   # Agentes de IA con LangGraph
│   └── schemas/                  # Esquemas Pydantic
├── frontend/                     # Aplicación React
│   ├── src/
│   │   ├── components/           # Componentes reutilizables
│   │   ├── pages/               # Páginas de la aplicación
│   │   ├── contexts/            # Contextos de React
│   │   └── lib/                 # Utilidades
│   └── package.json
├── alembic/                      # Migraciones de base de datos
├── .github/workflows/            # Pipeline CI/CD
├── docker-compose.yml           # Configuración de desarrollo
├── docker-compose.prod.yml      # Configuración de producción
└── requirements.txt             # Dependencias Python
```

## 🔧 Desarrollo

### Backend

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar en modo desarrollo
uvicorn src.main:app --reload

# Ejecutar migraciones
alembic upgrade head

# Crear nueva migración
alembic revision --autogenerate -m "Descripción del cambio"
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Pruebas

```bash
# Pruebas unitarias del backend
pytest tests/ -v

# Pruebas E2E con Playwright
pytest tests/e2e/ -v

# Linting y formateo
black src/
flake8 src/
```

## 🤖 Agentes de IA

El sistema incluye agentes especializados construidos con LangGraph:

### Agente de Procesamiento de Facturas
- Extrae datos de documentos PDF/imágenes usando Azure Document Intelligence
- Estructura información con OpenAI
- Requiere validación humana antes de persistir

### Agente de Consultas de Base de Datos
- Permite consultas en lenguaje natural
- Genera SQL automáticamente
- Sintetiza resultados en respuestas legibles

## 🔐 Autenticación y Autorización

- **JWT**: Tokens de acceso seguros
- **RBAC**: Control de acceso basado en roles
  - `admin`: Acceso completo al sistema
  - `finance_user`: Gestión financiera
  - `manager`: Gestión operativa
  - `employee`: Acceso básico

## 🚀 Despliegue

### Desarrollo Local
```bash
docker-compose up -d
```

### Producción (VPS Hostinger)
El pipeline de CI/CD se encarga automáticamente del despliegue cuando se hace push a:
- `develop` → Staging
- `main` → Producción

### Migración de Base de Datos

Para migrar datos desde desarrollo local a producción:

```bash
# 1. Crear volcado local
docker-compose exec db pg_dump -U opendoors_user -d opendoors_db > backup.sql

# 2. Procesar volcado para producción
sed 's/OWNER TO opendoors_user;/OWNER TO production_user;/' backup.sql > backup_prod.sql

# 3. Transferir al servidor
scp backup_prod.sql user@server:/opt/opendoors/

# 4. Restaurar en producción
cat backup_prod.sql | docker-compose exec -T db psql -U production_user -d production_db
```

## 📊 Monitoreo y Logs

- **Health Checks**: Endpoints `/health` para verificar estado
- **Logs**: Configuración de logging estructurado
- **Métricas**: Preparado para integración con Prometheus/Grafana

## 🔧 Configuración de Azure

El sistema utiliza varios servicios de Azure:

- **Azure OpenAI**: GPT-4 para procesamiento de lenguaje natural
- **Azure Document Intelligence**: Extracción de texto de documentos
- **Azure Cognitive Search**: Búsqueda semántica
- **Azure Storage**: Almacenamiento de archivos

Configurar las credenciales en el archivo `.env`:

```env
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario de Open Doors.

## 🆘 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Open Doors** - Transformando la gestión empresarial con inteligencia artificial.
