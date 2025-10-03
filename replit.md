# Open Doors - Sistema de Facturación y Gestión Empresarial

## Descripción del Proyecto

Sistema completo de facturación con lógica fiscal argentina (Balance IVA vs Balance General), procesamiento de facturas con Azure AI, y gestión multi-partner para Open Doors.

## Estado Actual del Proyecto (03 Oct 2025)

### 🔧 Configuración Reciente (Última actualización: 03 Oct 2025 - 21:27)

**✅ Problemas Resueltos en esta sesión:**
- ✅ Error crítico de Select.Item con value vacío arreglado
- ✅ Dashboard actualizado con datos reales de Balance por Socio
- ✅ Endpoint `/api/v1/financial/balance-por-socio` integrado correctamente
- ✅ Procesamiento de facturas A/B/C con parámetros fiscales (movimiento_cuenta, es_compensacion_iva)
- ✅ Menú reorganizado en 5 secciones lógicas
- ✅ Componente DataTable reutilizable creado
- ✅ Balance IVA centralizado en FinancialService

**✅ Problemas Resueltos anteriormente:**
- ✅ Conflictos de Git resueltos en múltiples archivos
- ✅ Conexión a base de datos PostgreSQL (Neon) configurada correctamente
- ✅ SSL/TLS configurado para asyncpg
- ✅ Frontend configurado con dependencias instaladas
- ✅ API del frontend apuntando correctamente al backend (puerto 5000)
- ✅ Variables de entorno configuradas

**🚀 Sistema Funcionando:**
- Backend: http://localhost:5000 (FastAPI + PostgreSQL)
- Frontend: http://localhost:5000 (React + Vite)
- Documentación API: http://localhost:5000/docs

## Estado Actual del Proyecto (03 Oct 2025)

### ✅ Implementado Completamente

#### Backend (Python/FastAPI)
- **Modelos de Base de Datos** (SQLModel + PostgreSQL):
  - `User`: Sistema de usuarios con roles jerárquicos
  - `Invoice`: Facturas con lógica fiscal argentina (tipos A/B/C/X)
  - `Partner`: Gestión de socios/proveedores
  - `PartnerProfile`: Perfiles extendidos de socios

- **Servicios de Lógica Fiscal**:
  - `FinancialCalculator`: Cálculos de Balance IVA y Balance General según normativa argentina
  - `CurrencyValidator`: Validación de formato argentino ($1.234,56)
  - Sistema de permisos con roles jerárquicos

- **Endpoints API Funcionales**:
  - `/api/auth/*` - Autenticación JWT
  - `/api/users/*` - Gestión de usuarios
  - `/api/invoices/*` - CRUD completo de facturas + autoguardado
  - `/api/v1/partners/*` - Gestión de socios/proveedores
  - `/api/v1/financial/*` - Reportes financieros (Balance IVA, Balance General, por socio)
  - `/api/v1/analysis/*` - Análisis financiero
  - `/api/v1/approval/*` - Aprobación de pagos

#### Configuración y Seguridad
- Sistema de permisos con 7 roles: superadmin, admin, accountant, approver, editor, partner, viewer
- Autenticación JWT con tokens de larga duración
- PostgreSQL configurado y conectado
- CORS habilitado para desarrollo

### 📚 Documentación de Replicación Creada

Se crearon 4 guías completas con código copiable para replicación en entorno local:

1. **GUIA_COMPLETA_REPLICACION.txt** (Parte 1):
   - Setup inicial completo
   - Modelos y servicios backend
   - Configuración de PostgreSQL
   - Sistema de permisos
   - Endpoints financieros

2. **GUIA_PARTE_2_ENDPOINTS_FRONTEND.txt** (Parte 2):
   - Endpoints faltantes (CRUD completo)
   - Setup de frontend React + TypeScript
   - Design system con colores fiscales
   - Componentes DataTable y CurrencyInput

3. **GUIA_PARTE_3_GRAFICAS_DEPLOYMENT.txt** (Parte 3):
   - Componentes de gráficas analíticas
   - Páginas completas del frontend
   - Testing con pytest
   - Docker Compose para producción

4. **GUIA_USO_CON_CURSOR_AI.txt** (Parte 4):
   - Cómo trabajar con Cursor AI usando las guías
   - Estrategias de trabajo con código existente
   - Prompts específicos para cada módulo
   - Resolución de conflictos

### 🔧 Archivos de Configuración para Sincronización

1. **.cursorrules**: Reglas para AI assistants (Cursor AI, GitHub Copilot, etc.)
   - Arquitectura completa del proyecto
   - Reglas fiscales críticas de Joni
   - Convenciones de código
   - Sistema de permisos
   - Comandos útiles

2. **COMO_SINCRONIZAR_CON_REPLIT.txt**: Instrucciones paso a paso
   - Descargar código desde Replit
   - Estrategias de sincronización (completa vs selectiva)
   - Archivos críticos prioritarios
   - Validación post-sincronización
   - Solución de problemas comunes

### ⚠️ Pendiente de Implementación en Replit

Estos componentes tienen el código completo en las guías pero aún no están en el codebase de Replit:

- Frontend React completo
- Componentes de gráficas (Recharts)
- Páginas Dashboard y Analytics
- Testing automatizado con pytest
- Configuración Docker para producción

## Credenciales de Acceso

### Superadmin (Único con acceso total)
```
Email: cortsfranco@hotmail.com
Password: Ncc1701E@
Rol: SUPERADMIN
```

## Reglas de Negocio Críticas

### Lógica Fiscal Argentina (según Joni)

1. **Balance IVA**:
   - ✅ SOLO facturas tipo A (con IVA discriminado)
   - Formula: IVA emitido - IVA recibido
   - Excluye facturas con `es_compensacion_iva=True`

2. **Balance General**:
   - ✅ SOLO facturas con `movimiento_cuenta=SI`
   - Representa flujo de caja real
   - Formula: Ingresos - Egresos (solo mov. reales)

3. **Formato de Moneda**:
   - ✅ Formato argentino: $1.234,56
   - Punto para miles, coma para decimales
   - Auto-corrección de formato inglés

### Tipos de Factura

- **Tipo A**: Con IVA discriminado → Cuenta para Balance IVA
- **Tipo B**: IVA incluido → NO cuenta para Balance IVA
- **Tipo C**: Sin IVA → NO cuenta para Balance IVA
- **Tipo X**: Otros comprobantes

### Socios/Partners Tracked

- Franco (SUPERADMIN)
- Joni
- Hernán
- Maxi
- Leo

## Arquitectura Técnica

### Stack Backend
```
Python 3.11+
FastAPI 0.104.1
SQLModel + SQLAlchemy 2.0
PostgreSQL 14+
Alembic (migrations)
bcrypt (password hashing)
python-jose (JWT)
```

### Stack Frontend (documentado en guías)
```
React 18 + TypeScript
Vite
TanStack Query
Recharts (gráficas)
Tailwind CSS
Axios
```

### Azure Services Integration
```
Azure OpenAI (GPT-4o)
Azure Document Intelligence
Azure Cognitive Search
Azure Blob Storage
```

## Estructura del Proyecto

```
open-doors-billing/
├── src/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── auth.py          ✅ Autenticación
│   │   │   ├── users.py         ✅ Gestión de usuarios
│   │   │   ├── invoices.py      ✅ CRUD facturas
│   │   │   ├── partners.py      ✅ Gestión socios
│   │   │   ├── financial_reports.py ✅ Reportes
│   │   │   ├── analysis.py      ✅ Análisis
│   │   │   ├── approval.py      ✅ Aprobaciones
│   │   │   └── ...
│   │   └── deps/
│   ├── core/
│   │   ├── config.py            ✅ Configuración
│   │   ├── database.py          ✅ DB setup
│   │   ├── security.py          ✅ JWT & hashing
│   │   └── permissions.py       ✅ Sistema de permisos
│   ├── models/
│   │   ├── user.py              ✅ Modelo User
│   │   ├── invoice.py           ✅ Modelo Invoice
│   │   └── partner.py           ✅ Modelo Partner
│   ├── services/
│   │   ├── financial_calculator.py ✅ Lógica fiscal
│   │   └── currency_validator.py   ✅ Validación moneda
│   └── main.py                  ✅ Entry point
├── tests/                       ⚠️ Documentado en guías
├── frontend/                    ⚠️ Documentado en guías
├── GUIA_COMPLETA_REPLICACION.txt    ✅
├── GUIA_PARTE_2_ENDPOINTS_FRONTEND.txt ✅
├── GUIA_PARTE_3_GRAFICAS_DEPLOYMENT.txt ✅
└── requirements.txt             ✅
```

## Próximos Pasos para Implementación Completa

1. **Implementar Frontend** (código ya disponible en guías):
   - Setup React + Vite
   - Componentes DataTable y CurrencyInput
   - Página Dashboard con KPIs
   - Gráficas analíticas

2. **Implementar Testing** (código ya disponible):
   - Tests unitarios con pytest
   - Tests de integración
   - Validación de lógica fiscal

3. **Setup Docker** (código ya disponible):
   - Dockerfile para backend
   - docker-compose.yml completo
   - Script de deployment

4. **Integrar Azure AI** (mejoras documentadas):
   - Mejorar agente de procesamiento
   - Implementar reintentos
   - Optimizar prompts

## Comandos Útiles

### Desarrollo
```bash
# Iniciar servidor backend
uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload

# Acceder a docs interactivos
http://localhost:5000/docs

# Test de autenticación
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=cortsfranco@hotmail.com&password=Ncc1701E@"
```

### Testing (cuando esté implementado)
```bash
pytest tests/ -v
pytest tests/test_financial_calculator.py -v
```

### Producción (cuando esté implementado)
```bash
docker-compose up -d
docker-compose logs -f
```

## Variables de Entorno Necesarias

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/db
POSTGRES_USER=opendoors_user
POSTGRES_PASSWORD=...
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=opendoors_billing

# Seguridad
SECRET_KEY=... (generar con: openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Azure Document Intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=...
AZURE_DOC_INTELLIGENCE_KEY=...

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=...
AZURE_SEARCH_ADMIN_KEY=...

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_ACCOUNT_KEY=...
```

## Notas Importantes

1. **No usar mock data**: El sistema está diseñado para trabajar con datos reales de Azure
2. **Validación estricta**: Todos los montos se validan con `FinancialCalculator.validar_coherencia_montos()`
3. **Soft delete**: Las facturas se marcan como eliminadas pero no se borran físicamente
4. **Multi-partner**: Cada factura debe tener un `socio_responsable` asignado
5. **Autoguardado**: El frontend (cuando se implemente) usa debounce de 1 segundo

## Referencias

- PDF LangGraph Multi-Agent: Patrones para implementación de agentes
- Transcripciones de Joni: Lógica de negocio Balance IVA vs General
- Excel de socios: Datos de Franco, Joni, Hernán, Maxi, Leo

## Contacto y Soporte

**Superadmin**: Franco Corts (cortsfranco@hotmail.com)

---

**Última actualización**: 03 de octubre de 2025
**Estado del servidor**: ✅ Running on port 5000
**Base de datos**: ✅ PostgreSQL connected
