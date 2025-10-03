"""
Router para integración con AFIP.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from pydantic import BaseModel

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.services.afip_service import AFIPService, AFIPCredentials, CAEValidation, TaxpayerInfo

router = APIRouter()

# Esquemas Pydantic
class CAEValidationRequest(BaseModel):
    cae: str
    point_of_sale: int
    invoice_number: int

class TaxpayerInfoRequest(BaseModel):
    cuit: str

class ElectronicInvoiceRequest(BaseModel):
    invoice_type: int = 1  # 1 = Factura A, 6 = Factura B
    point_of_sale: int
    document_type: int = 96  # 96 = DNI, 80 = CUIL, 99 = Consumidor Final
    document_number: str
    concept: int = 1  # 1 = Productos, 2 = Servicios
    net_amount: float
    tax_amount: float
    total: float
    service_from: Optional[str] = None
    service_to: Optional[str] = None
    payment_due: Optional[str] = None

class CAEValidationResponse(BaseModel):
    is_valid: bool
    cae: Optional[str] = None
    expiration_date: Optional[str] = None
    error_message: Optional[str] = None
    invoice_data: Optional[Dict[str, Any]] = None

class TaxpayerInfoResponse(BaseModel):
    cuit: str
    name: str
    address: str
    tax_category: str
    is_active: bool
    vat_condition: str

class ElectronicInvoiceResponse(BaseModel):
    success: bool
    cae: Optional[str] = None
    expiration_date: Optional[str] = None
    invoice_number: Optional[int] = None
    point_of_sale: Optional[int] = None
    error_message: Optional[str] = None

def get_afip_service() -> AFIPService:
    """Obtener instancia del servicio AFIP."""
    # En una implementación real, las credenciales vendrían de configuración
    credentials = AFIPCredentials(
        cuit="20123456789",  # CUIT de ejemplo
        certificate_path="/path/to/certificate.crt",
        private_key_path="/path/to/private.key",
        production=False  # Usar False para testing
    )
    
    return AFIPService(credentials)

@router.post("/validate-cae", response_model=CAEValidationResponse, summary="Validar CAE con AFIP")
async def validate_cae(
    request: CAEValidationRequest,
    current_user: User = Depends(get_current_user),
    afip_service: AFIPService = Depends(get_afip_service)
):
    """
    Validar CAE (Código de Autorización Electrónica) con AFIP.
    """
    try:
        validation = await afip_service.validate_cae(
            cae=request.cae,
            point_of_sale=request.point_of_sale,
            invoice_number=request.invoice_number
        )
        
        return CAEValidationResponse(
            is_valid=validation.is_valid,
            cae=validation.cae,
            expiration_date=validation.expiration_date,
            error_message=validation.error_message,
            invoice_data=validation.invoice_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validando CAE: {str(e)}"
        )

@router.post("/taxpayer-info", response_model=TaxpayerInfoResponse, summary="Obtener información de contribuyente")
async def get_taxpayer_info(
    request: TaxpayerInfoRequest,
    current_user: User = Depends(get_current_user),
    afip_service: AFIPService = Depends(get_afip_service)
):
    """
    Obtener información de un contribuyente desde AFIP.
    """
    try:
        taxpayer_info = await afip_service.get_taxpayer_info(request.cuit)
        
        if not taxpayer_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró información del contribuyente"
            )
        
        return TaxpayerInfoResponse(
            cuit=taxpayer_info.cuit,
            name=taxpayer_info.name,
            address=taxpayer_info.address,
            tax_category=taxpayer_info.tax_category,
            is_active=taxpayer_info.is_active,
            vat_condition=taxpayer_info.vat_condition
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo información del contribuyente: {str(e)}"
        )

@router.post("/generate-electronic-invoice", response_model=ElectronicInvoiceResponse, summary="Generar factura electrónica")
async def generate_electronic_invoice(
    request: ElectronicInvoiceRequest,
    current_user: User = Depends(get_current_user),
    afip_service: AFIPService = Depends(get_afip_service)
):
    """
    Generar factura electrónica y obtener CAE de AFIP.
    """
    try:
        # Convertir datos de la petición a formato interno
        invoice_data = {
            'invoice_type': request.invoice_type,
            'point_of_sale': request.point_of_sale,
            'document_type': request.document_type,
            'document_number': request.document_number,
            'concept': request.concept,
            'net_amount': request.net_amount,
            'tax_amount': request.tax_amount,
            'total': request.total,
            'service_from': request.service_from,
            'service_to': request.service_to,
            'payment_due': request.payment_due
        }
        
        result = await afip_service.generate_electronic_invoice(invoice_data)
        
        if result.get('success'):
            return ElectronicInvoiceResponse(
                success=True,
                cae=result.get('cae'),
                expiration_date=result.get('expiration_date'),
                invoice_number=result.get('invoice_number'),
                point_of_sale=result.get('point_of_sale')
            )
        else:
            return ElectronicInvoiceResponse(
                success=False,
                error_message=result.get('error_message', 'Error generando factura')
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando factura electrónica: {str(e)}"
        )

@router.get("/invoice-types", summary="Obtener tipos de comprobante AFIP")
async def get_invoice_types():
    """
    Obtener lista de tipos de comprobante válidos según AFIP.
    """
    invoice_types = [
        {"code": 1, "description": "Factura A"},
        {"code": 2, "description": "Nota de Débito A"},
        {"code": 3, "description": "Nota de Crédito A"},
        {"code": 6, "description": "Factura B"},
        {"code": 7, "description": "Nota de Débito B"},
        {"code": 8, "description": "Nota de Crédito B"},
        {"code": 11, "description": "Factura C"},
        {"code": 12, "description": "Nota de Débito C"},
        {"code": 13, "description": "Nota de Crédito C"},
        {"code": 51, "description": "Factura M"},
        {"code": 52, "description": "Nota de Débito M"},
        {"code": 53, "description": "Nota de Crédito M"},
    ]
    
    return {"invoice_types": invoice_types}

@router.get("/document-types", summary="Obtener tipos de documento AFIP")
async def get_document_types():
    """
    Obtener lista de tipos de documento válidos según AFIP.
    """
    document_types = [
        {"code": 80, "description": "CUIT"},
        {"code": 86, "description": "CUIL"},
        {"code": 87, "description": "CDI"},
        {"code": 89, "description": "LE"},
        {"code": 90, "description": "LC"},
        {"code": 91, "description": "CI Extranjera"},
        {"code": 92, "description": "En Trámite"},
        {"code": 93, "description": "Acta Nacimiento"},
        {"code": 94, "description": "Pasaporte"},
        {"code": 95, "description": "CI Bs.As. RNP"},
        {"code": 96, "description": "DNI"},
        {"code": 99, "description": "Consumidor Final"},
    ]
    
    return {"document_types": document_types}

@router.get("/concepts", summary="Obtener conceptos AFIP")
async def get_concepts():
    """
    Obtener lista de conceptos válidos según AFIP.
    """
    concepts = [
        {"code": 1, "description": "Productos"},
        {"code": 2, "description": "Servicios"},
        {"code": 3, "description": "Productos y Servicios"},
    ]
    
    return {"concepts": concepts}

@router.get("/afip-status", summary="Verificar estado de servicios AFIP")
async def check_afip_status(
    afip_service: AFIPService = Depends(get_afip_service)
):
    """
    Verificar el estado de los servicios AFIP.
    """
    try:
        # Intentar autenticar para verificar conectividad
        auth_result = await afip_service.authenticate()
        
        return {
            "afip_connected": auth_result,
            "services_status": {
                "wsaa": auth_result,
                "wsfev1": auth_result,
                "ws_sr_constancia_inscripcion": auth_result
            },
            "timestamp": "2024-12-19T10:00:00Z"
        }
        
    except Exception as e:
        return {
            "afip_connected": False,
            "services_status": {
                "wsaa": False,
                "wsfev1": False,
                "ws_sr_constancia_inscripcion": False
            },
            "error": str(e),
            "timestamp": "2024-12-19T10:00:00Z"
        }

