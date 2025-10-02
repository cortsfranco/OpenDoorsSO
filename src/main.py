"""
Punto de entrada principal de la aplicación FastAPI.
Configura la aplicación y registra todos los routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.core.config import settings
from src.core.database import engine
from src.api.routers import auth, users, companies, invoices, clients, invoice_upload, analysis, approval, partners, system_settings, financial_reports
from src.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación."""
    # Inicializar base de datos (opcional - solo si está disponible)
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: Database not available - {e}")
        print("Running in development mode without database.")
    yield
    # Cleanup (si es necesario)


app = FastAPI(
    title="Open Doors - Sistema de Gestión Empresarial",
    description="Plataforma de gestión empresarial con IA para Open Doors",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router, prefix="/api/auth", tags=["autenticación"])
app.include_router(users.router, prefix="/api/users", tags=["usuarios"])
app.include_router(companies.router, prefix="/api/companies", tags=["empresas"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["facturas"])
app.include_router(clients.router, prefix="/api/clients", tags=["clientes"])
app.include_router(invoice_upload.router, prefix="/api/v1/invoices", tags=["procesamiento de facturas"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["análisis financiero"])
app.include_router(approval.router, prefix="/api/v1/approval", tags=["aprobación de pagos"])
app.include_router(partners.router, prefix="/api/v1/partners", tags=["socios y proveedores"])
app.include_router(system_settings.router, prefix="/api/v1/system", tags=["configuraciones del sistema"])
app.include_router(financial_reports.router, prefix="/api/v1", tags=["reportes financieros"])


@app.get("/")
async def root():
    """Endpoint raíz de la API."""
    return {
        "message": "Open Doors - Sistema de Gestión Empresarial",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud."""
    return {"status": "healthy"}
