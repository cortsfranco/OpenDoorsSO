"""
Router para subida y procesamiento de facturas con IA.
"""

import uuid
import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError

from src.core.database import get_session
from src.core.security import get_current_user
from src.core.config import settings
from src.models.user import User
from src.models.invoice import Invoice
from src.agents.invoice_processing_agent import InvoiceProcessingAgent

router = APIRouter()
security = HTTPBearer()


class InvoiceUploadService:
    """Servicio para manejar la subida y procesamiento de facturas."""
    
    def __init__(self):
        self.azure_storage_client = None
        self.invoice_agent = InvoiceProcessingAgent()
    
    def _get_azure_storage_client(self):
        """Obtiene el cliente de Azure Blob Storage."""
        if not self.azure_storage_client:
            connection_string = (
                f"DefaultEndpointsProtocol=https;"
                f"AccountName={settings.AZURE_STORAGE_ACCOUNT_NAME};"
                f"AccountKey={settings.AZURE_STORAGE_ACCOUNT_KEY};"
                f"EndpointSuffix=core.windows.net"
            )
            self.azure_storage_client = BlobServiceClient.from_connection_string(connection_string)
        return self.azure_storage_client
    
    async def upload_file_to_azure(self, file: UploadFile, user_id: int) -> Dict[str, Any]:
        """
        Sube un archivo a Azure Blob Storage o almacenamiento local (desarrollo).
        
        Args:
            file: Archivo a subir
            user_id: ID del usuario que sube el archivo
            
        Returns:
            Diccionario con información del archivo subido
            
        Raises:
            HTTPException: Si hay error en la subida
        """
        try:
            # Validar tipo de archivo
            allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.txt'}
            file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
            
            if f'.{file_extension}' not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tipo de archivo no permitido. Extensiones permitidas: {', '.join(allowed_extensions)}"
                )
            
            # Generar nombre único para el archivo
            unique_filename = f"{user_id}/{uuid.uuid4()}_{file.filename}"
            
            # Leer contenido del archivo
            file_content = await file.read()
            
            # Verificar si Azure Storage está configurado correctamente
            use_local_storage = (
                not settings.AZURE_STORAGE_ACCOUNT_NAME or 
                not settings.AZURE_STORAGE_ACCOUNT_KEY or 
                not settings.AZURE_STORAGE_CONTAINER_NAME or
                settings.AZURE_STORAGE_ACCOUNT_NAME == "" or
                settings.AZURE_STORAGE_ACCOUNT_KEY == "" or
                settings.AZURE_STORAGE_CONTAINER_NAME == ""
            )
            
            if not use_local_storage:
                
                # Subir a Azure Blob Storage
                blob_client = self._get_azure_storage_client().get_blob_client(
                    container=settings.AZURE_STORAGE_CONTAINER_NAME,
                    blob=unique_filename
                )
                
                # Subir el archivo
                blob_client.upload_blob(
                    file_content,
                    overwrite=True,
                    content_type=file.content_type or 'application/octet-stream'
                )
                
                return {
                    "filename": file.filename,
                    "blob_name": unique_filename,
                    "file_size": len(file_content),
                    "content_type": file.content_type,
                    "blob_url": blob_client.url
                }
            else:
                # Modo desarrollo: guardar localmente
                upload_dir = "uploads"
                os.makedirs(upload_dir, exist_ok=True)
                
                local_file_path = os.path.join(upload_dir, unique_filename.replace("/", "_"))
                
                with open(local_file_path, "wb") as f:
                    f.write(file_content)
                
                # URL local para desarrollo
                blob_url = f"file://{os.path.abspath(local_file_path)}"
                
                return {
                    "filename": file.filename,
                    "blob_name": unique_filename,
                    "file_size": len(file_content),
                    "content_type": file.content_type,
                    "blob_url": blob_url,
                    "local_path": local_file_path
                }
            
        except AzureError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al subir archivo a Azure Storage: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error inesperado al subir archivo: {str(e)}"
            )
    
    async def process_invoice_with_ai(
        self, 
        file_info: Dict[str, Any], 
        user_id: int, 
        owner: str, 
        session: AsyncSession,
        invoice_direction: str = "recibida",
        movimiento_cuenta: bool = True,
        es_compensacion_iva: bool = False
    ) -> Dict[str, Any]:
        """
        Procesa una factura usando el agente de IA.
        
        Args:
            file_info: Información del archivo subido
            user_id: ID del usuario
            owner: Socio responsable
            session: Sesión de base de datos
            invoice_direction: Dirección (emitida/recibida)
            movimiento_cuenta: Si afecta flujo de caja real
            es_compensacion_iva: Si es solo compensación de IVA
            
        Returns:
            Resultado del procesamiento de IA
        """
        try:
            # Crear registro de factura en la base de datos
            invoice = Invoice(
                user_id=user_id,
                filename=file_info["filename"],
                status="pending",
                blob_url=file_info["blob_url"],
                owner=owner,
                invoice_direction=invoice_direction,
                movimiento_cuenta=movimiento_cuenta,
                es_compensacion_iva=es_compensacion_iva
            )
            session.add(invoice)
            await session.commit()
            await session.refresh(invoice)
            
            # Inicializar el agente con la sesión
            agent = InvoiceProcessingAgent(session=session)
            
            # Procesar la factura usando LangGraph
            result = await agent.process_invoice_from_url(
                blob_url=file_info["blob_url"],
                user_id=user_id,
                company_id=None,  # Por ahora no usamos company_id
                invoice_id=invoice.id
            )
            
            return {
                "invoice_id": invoice.id,
                "processing_result": result,
                "status": result.get("status", "completed")
            }
            
        except Exception as e:
            # Si hay error, actualizar el estado de la factura
            if 'invoice' in locals():
                invoice.status = "error"
                await session.commit()
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar factura con IA: {str(e)}"
            )


# Instancia global del servicio
upload_service = InvoiceUploadService()


@router.post("/upload")
async def upload_invoice(
    file: UploadFile = File(...),
    owner: str = Form("Hernán Pagani"),
    invoice_direction: str = Form("recibida"),
    movimiento_cuenta: bool = Form(True),
    es_compensacion_iva: bool = Form(False),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Endpoint para subir y procesar facturas con IA.
    
    Este endpoint:
    1. Autentica al usuario usando JWT
    2. Valida el tipo de archivo
    3. Sube el archivo a Azure Blob Storage
    4. Inicia el procesamiento con LangGraph
    5. Retorna el resultado del procesamiento
    
    Args:
        file: Archivo de factura a procesar
        owner: Socio responsable (Hernán, Joni, Maxi, Leo, Franco)
        invoice_direction: Dirección (emitida/recibida)
        movimiento_cuenta: SI = movimiento real de dinero, NO = compensación IVA
        es_compensacion_iva: True = factura solo para compensar IVA
        current_user: Usuario autenticado
        session: Sesión de base de datos
        
    Returns:
        Resultado del procesamiento de la factura
    """
    
    # Verificar que el archivo no esté vacío
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionó ningún archivo"
        )
    
    # Verificar tamaño del archivo (máximo 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es demasiado grande. Tamaño máximo permitido: 10MB"
        )
    
    # Resetear el puntero del archivo para poder leerlo de nuevo
    await file.seek(0)
    
    try:
        # 1. Subir archivo a Azure Blob Storage
        upload_result = await upload_service.upload_file_to_azure(file, current_user.id)
        
        # 2. Procesar con agente de IA
        processing_result = await upload_service.process_invoice_with_ai(
            upload_result, 
            current_user.id, 
            owner, 
            session,
            invoice_direction=invoice_direction,
            movimiento_cuenta=movimiento_cuenta,
            es_compensacion_iva=es_compensacion_iva
        )
        
        # 3. Retornar resultado completo
        return {
            "message": "Factura subida y procesada exitosamente",
            "upload_info": upload_result,
            "processing_result": processing_result,
            "user_id": current_user.id,
            "status": "success"
        }
        
    except HTTPException:
        # Re-raise HTTPExceptions
        raise
    except Exception as e:
        # Manejar errores inesperados
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado: {str(e)}"
        )


@router.get("/upload/status/{task_id}")
async def get_upload_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para consultar el estado de procesamiento de una factura.
    
    Args:
        task_id: ID de la tarea de procesamiento
        current_user: Usuario autenticado
        
    Returns:
        Estado actual del procesamiento
    """
    # TODO: Implementar sistema de tracking de tareas
    # Por ahora retornamos un estado básico
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "El procesamiento está en curso"
    }
