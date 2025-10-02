"""
Router para operaciones relacionadas con empresas.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_companies():
    """Obtiene la lista de empresas."""
    return {"message": "Endpoint de empresas - En desarrollo"}

@router.post("/")
async def create_company():
    """Crea una nueva empresa."""
    return {"message": "Endpoint de empresas - En desarrollo"}