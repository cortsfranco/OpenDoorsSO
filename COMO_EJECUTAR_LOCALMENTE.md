# Cómo Ejecutar Open Doors Localmente

## ✅ Pre-requisitos

- Python 3.11+
- Node.js 18+ y npm
- PostgreSQL 14+ (o usar la base de datos de Replit/Neon)

## 📦 Instalación

### 1. Backend (Python/FastAPI)

```bash
# Instalar dependencias de Python
pip install -r requirements.txt

# O si usas un entorno virtual:
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend (React/TypeScript)

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias de Node.js
npm install
```

### 3. Base de Datos

**Opción A: Usar la base de datos de Replit/Neon (recomendado)**
- Ya está configurada con DATABASE_URL
- No requiere instalación local de PostgreSQL

**Opción B: PostgreSQL Local**
```bash
# Crear base de datos local
createdb opendoors_db

# Configurar en .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/opendoors_db
```

## 🚀 Ejecución

### Opción 1: Ejecutar todo desde la raíz (recomendado para desarrollo)

**Terminal 1 - Backend:**
```bash
uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Opción 2: Usar los scripts de desarrollo

**Windows:**
```bash
# Iniciar backend y frontend
start-dev.bat

# Detener todo
stop-dev.bat
```

**Linux/Mac:**
```bash
# Iniciar backend y frontend
./start-dev.sh

# Detener todo
./stop-dev.sh
```

## 🌐 Acceder a la Aplicación

Una vez iniciado, la aplicación estará disponible en:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Documentación API:** http://localhost:5000/docs
- **API Alternativa:** http://localhost:5000/redoc

## 🔑 Credenciales de Acceso

### Superadmin
```
Email: cortsfranco@hotmail.com
Password: Ncc1701E@
Rol: SUPERADMIN
```

## 📋 Variables de Entorno

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Base de datos (ya configurada en Replit)
DATABASE_URL=postgresql://neondb_owner:...@ep-round-rice-af1dr467.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# O para desarrollo local:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/opendoors_db

# Seguridad
SECRET_KEY=un_valor_secreto_complejo_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Azure (opcional, solo si usas procesamiento de facturas con IA)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_DOC_INTELLIGENCE_ENDPOINT=
AZURE_DOC_INTELLIGENCE_KEY=
```

Para el frontend, crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## 🔧 Solución de Problemas

### Error: "Database not available"
- Verifica que DATABASE_URL esté configurada correctamente
- Si usas PostgreSQL local, asegúrate de que esté corriendo

### Error: "Port 5000 already in use"
- Detén cualquier proceso usando el puerto 5000
- O cambia el puerto en el comando uvicorn

### Error: "Module not found" en Python
- Asegúrate de haber instalado todas las dependencias: `pip install -r requirements.txt`

### Error de CORS en el frontend
- Verifica que el backend esté corriendo en http://localhost:5000
- Revisa que VITE_API_URL en `frontend/.env` apunte a la URL correcta

### Pantalla en blanco en el frontend
- Verifica que el backend esté corriendo
- Abre las herramientas de desarrollador del navegador (F12) y revisa la consola
- Asegúrate de que la URL de la API en `frontend/src/services/api.ts` sea correcta

## 📚 Recursos Adicionales

- **Documentación del proyecto:** Ver `replit.md` para arquitectura completa
- **Guías de replicación:** Ver `GUIA_COMPLETA_REPLICACION.txt` y archivos relacionados
- **Lógica fiscal:** Ver transcripciones de Joni para entender Balance IVA vs Balance General

## 🆘 Soporte

Para problemas o preguntas:
- Revisa la documentación en `replit.md`
- Consulta las guías de replicación
- Contacta al superadmin: cortsfranco@hotmail.com
