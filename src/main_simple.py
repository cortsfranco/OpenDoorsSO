"""
Aplicación FastAPI simplificada para Open Doors Billing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Configuración básica
DATABASE_URL = "postgresql://opendoors_user:TuPasswordSegura@localhost:5432/opendoors_billing"
SECRET_KEY = "cambiar-en-produccion-por-una-clave-segura"
ALLOWED_HOSTS = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona ciclo de vida de la aplicación"""
    print("✅ Aplicación iniciada")
    yield
    print("✅ Aplicación cerrada")

app = FastAPI(
    title="Open Doors - Sistema de Facturación",
    description="Sistema completo de gestión de facturas con lógica fiscal argentina",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Open Doors - Sistema de Facturación",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Endpoints básicos de autenticación
@app.post("/api/auth/login")
async def login(username: str, password: str):
    """Login básico para testing"""
    if username == "cortsfranco@hotmail.com" and password == "Ncc1701E@":
        return {
            "access_token": "fake-jwt-token",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": "cortsfranco@hotmail.com",
                "full_name": "Franco Corts",
                "role": "superadmin",
                "is_active": True
            }
        }
    return {"error": "Credenciales inválidas"}

@app.get("/api/auth/me")
async def get_current_user():
    """Usuario actual para testing"""
    return {
        "id": 1,
        "email": "cortsfranco@hotmail.com",
        "full_name": "Franco Corts",
        "role": "superadmin",
        "is_active": True
    }

# Endpoints básicos de reportes financieros
@app.get("/api/v1/financial/balance-iva")
async def get_balance_iva():
    """Balance IVA básico para testing"""
    return {
        "iva_emitido": 1000.00,
        "iva_recibido": 500.00,
        "balance_iva": 500.00,
        "estado": "A PAGAR"
    }

@app.get("/api/v1/financial/balance-general")
async def get_balance_general():
    """Balance General básico para testing"""
    return {
        "ingresos": 5000.00,
        "egresos": 3000.00,
        "balance": 2000.00,
        "cantidad_facturas": 10
    }

@app.get("/api/v1/financial/resumen-completo")
async def get_resumen_completo():
    """Resumen completo básico para testing"""
    return {
        "balance_general": {
            "ingresos": 5000.00,
            "egresos": 3000.00,
            "balance": 2000.00
        },
        "balance_iva": {
            "iva_emitido": 1000.00,
            "iva_recibido": 500.00,
            "balance_iva": 500.00
        },
        "tendencia_mensual": [
            {"mes": "Enero", "ingresos": 2000, "egresos": 1500, "balance": 500},
            {"mes": "Febrero", "ingresos": 3000, "egresos": 1500, "balance": 1500}
        ],
        "distribucion_tipo": [
            {"tipo": "A", "cantidad": 5, "monto": 3000},
            {"tipo": "B", "cantidad": 3, "monto": 2000}
        ],
        "balance_socios": [
            {"socio": "Franco", "ingresos": 2000, "egresos": 1000, "balance": 1000},
            {"socio": "Joni", "ingresos": 1500, "egresos": 800, "balance": 700}
        ]
    }

# Endpoints básicos de facturas
@app.get("/api/invoices")
async def list_invoices():
    """Lista de facturas básica para testing"""
    return {
        "invoices": [
            {
                "id": 1,
                "filename": "factura_001.pdf",
                "total": 1000.00,
                "tipo_factura": "A",
                "fecha_emision": "2024-01-15",
                "socio_responsable": "Franco"
            }
        ],
        "total": 1
    }

@app.get("/api/partners")
async def list_partners():
    """Lista de socios básica para testing"""
    return {
        "partners": [
            {"id": 1, "name": "Franco", "email": "franco@opendoors.com"},
            {"id": 2, "name": "Joni", "email": "joni@opendoors.com"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
