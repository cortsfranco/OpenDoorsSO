"""
Router para operaciones relacionadas con clientes.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_clients():
    """Obtiene la lista de clientes."""
    return {"message": "Endpoint de clientes - En desarrollo"}

@router.post("/")
async def create_client():
    """Crea un nuevo cliente."""
    return {"message": "Endpoint de clientes - En desarrollo"}