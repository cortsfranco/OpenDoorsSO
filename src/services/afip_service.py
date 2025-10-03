"""
Servicio de integración con AFIP para validación CAE y facturación electrónica.
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class AFIPCredentials:
    """Credenciales para AFIP."""
    cuit: str
    certificate_path: str
    private_key_path: str
    production: bool = False

@dataclass
class CAEValidation:
    """Resultado de validación de CAE."""
    is_valid: bool
    cae: Optional[str] = None
    expiration_date: Optional[str] = None
    error_message: Optional[str] = None
    invoice_data: Optional[Dict[str, Any]] = None

@dataclass
class TaxpayerInfo:
    """Información del contribuyente."""
    cuit: str
    name: str
    address: str
    tax_category: str
    is_active: bool
    vat_condition: str

class AFIPService:
    """Servicio para integración con AFIP."""
    
    def __init__(self, credentials: AFIPCredentials):
        self.credentials = credentials
        self.base_url = (
            "https://servicios1.afip.gov.ar/wsfev1/service.asmx" if credentials.production
            else "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
        )
        self.wsaa_url = (
            "https://wsaa.afip.gov.ar/ws/services/LoginCms" if credentials.production
            else "https://wswhomo.afip.gov.ar/ws/services/LoginCms"
        )
        self.token = None
        self.sign = None
        self.token_expiration = None
    
    async def authenticate(self) -> bool:
        """
        Autenticar con WSAA (Web Service de Autenticación y Autorización).
        """
        try:
            logger.info("Autenticando con AFIP WSAA")
            
            # Generar XML de login
            login_xml = self._generate_login_xml()
            
            # Firmar el XML con el certificado
            signed_xml = self._sign_xml(login_xml)
            
            # Enviar petición a WSAA
            headers = {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                'SOAPAction': 'loginCms'
            }
            
            response = requests.post(
                self.wsaa_url,
                data=signed_xml,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Parsear respuesta
                root = ET.fromstring(response.content)
                self.token = root.find('.//token').text
                self.sign = root.find('.//sign').text
                
                # Calcular expiración (generalmente 1 hora)
                self.token_expiration = datetime.now() + timedelta(hours=1)
                
                logger.info("Autenticación exitosa con AFIP")
                return True
            else:
                logger.error(f"Error en autenticación AFIP: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error en autenticación AFIP: {str(e)}")
            return False
    
    def _generate_login_xml(self) -> str:
        """Generar XML para login en WSAA."""
        login_id = f"wsfe_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
        <loginTicketRequest version="1.0">
            <header>
                <source>CN=wsfe, O=AFIP, C=AR, SERIALNUMBER=CUIT {self.credentials.cuit}</source>
                <destination>cn=wsaahomo,o=afip,c=ar,serialNumber=CUIT 33693450239</destination>
                <uniqueId>{login_id}</uniqueId>
                <generationTime>{datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z</generationTime>
                <expirationTime>{(datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z</expirationTime>
            </header>
            <service>wsfe</service>
        </loginTicketRequest>"""
        
        return xml_content
    
    def _sign_xml(self, xml_content: str) -> str:
        """
        Firmar XML con certificado digital.
        En una implementación real, usaría OpenSSL o similar.
        """
        # Esta es una implementación simplificada
        # En producción, usar una librería como cryptography o pyOpenSSL
        logger.warning("Firma de XML simplificada - implementar con certificado real")
        return xml_content
    
    async def validate_cae(self, cae: str, point_of_sale: int, invoice_number: int) -> CAEValidation:
        """
        Validar CAE (Código de Autorización Electrónica) con AFIP.
        """
        try:
            # Verificar autenticación
            if not self._is_authenticated():
                if not await self.authenticate():
                    return CAEValidation(
                        is_valid=False,
                        error_message="No se pudo autenticar con AFIP"
                    )
            
            # Consultar estado del CAE
            response = await self._consult_invoice_status(point_of_sale, invoice_number)
            
            if response.get('success'):
                return CAEValidation(
                    is_valid=True,
                    cae=cae,
                    expiration_date=response.get('expiration_date'),
                    invoice_data=response.get('invoice_data')
                )
            else:
                return CAEValidation(
                    is_valid=False,
                    error_message=response.get('error_message', 'CAE inválido')
                )
                
        except Exception as e:
            logger.error(f"Error validando CAE: {str(e)}")
            return CAEValidation(
                is_valid=False,
                error_message=f"Error en validación: {str(e)}"
            )
    
    async def _consult_invoice_status(self, point_of_sale: int, invoice_number: int) -> Dict[str, Any]:
        """Consultar estado de una factura en AFIP."""
        try:
            # Generar XML para consulta
            soap_xml = self._generate_consult_xml(point_of_sale, invoice_number)
            
            headers = {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ar.gov.afip.dif.facturaelectronica/Consultar'
            }
            
            response = requests.post(
                self.base_url,
                data=soap_xml,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Parsear respuesta SOAP
                return self._parse_consult_response(response.content)
            else:
                return {
                    'success': False,
                    'error_message': f'Error HTTP: {response.status_code}'
                }
                
        except Exception as e:
            logger.error(f"Error consultando estado de factura: {str(e)}")
            return {
                'success': False,
                'error_message': str(e)
            }
    
    def _generate_consult_xml(self, point_of_sale: int, invoice_number: int) -> str:
        """Generar XML para consulta de factura."""
        return f"""<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Header>
                <Auth>
                    <Token>{self.token}</Token>
                    <Sign>{self.sign}</Sign>
                    <Cuit>{self.credentials.cuit}</Cuit>
                </Auth>
            </soap:Header>
            <soap:Body>
                <FECompConsultar xmlns="http://ar.gov.afip.dif.facturaelectronica/">
                    <FeCompConsReq>
                        <CbteTipo>1</CbteTipo>
                        <PtoVta>{point_of_sale}</PtoVta>
                        <CbteNro>{invoice_number}</CbteNro>
                    </FeCompConsReq>
                </FECompConsultar>
            </soap:Body>
        </soap:Envelope>"""
    
    def _parse_consult_response(self, xml_content: bytes) -> Dict[str, Any]:
        """Parsear respuesta de consulta AFIP."""
        try:
            root = ET.fromstring(xml_content)
            
            # Buscar errores
            errors = root.findall('.//Err')
            if errors:
                error_msg = errors[0].find('Msg').text if errors[0].find('Msg') is not None else 'Error desconocido'
                return {
                    'success': False,
                    'error_message': error_msg
                }
            
            # Buscar datos de la factura
            result = root.find('.//ResultGet')
            if result is not None:
                invoice_data = {
                    'authorized': result.find('Autorizado').text == '1',
                    'cae': result.find('CAE').text if result.find('CAE') is not None else None,
                    'expiration_date': result.find('CAEFchVto').text if result.find('CAEFchVto') is not None else None,
                    'total': float(result.find('ImpTotal').text) if result.find('ImpTotal') is not None else 0,
                    'tax': float(result.find('ImpIVA').text) if result.find('ImpIVA') is not None else 0,
                    'net_amount': float(result.find('ImpNeto').text) if result.find('ImpNeto') is not None else 0
                }
                
                return {
                    'success': True,
                    'invoice_data': invoice_data,
                    'expiration_date': invoice_data['expiration_date']
                }
            
            return {
                'success': False,
                'error_message': 'No se encontraron datos de la factura'
            }
            
        except Exception as e:
            logger.error(f"Error parseando respuesta AFIP: {str(e)}")
            return {
                'success': False,
                'error_message': f'Error parseando respuesta: {str(e)}'
            }
    
    async def get_taxpayer_info(self, cuit: str) -> Optional[TaxpayerInfo]:
        """
        Obtener información de un contribuyente desde AFIP.
        """
        try:
            # Verificar autenticación
            if not self._is_authenticated():
                if not await self.authenticate():
                    return None
            
            # Consultar datos del contribuyente
            response = await self._consult_taxpayer_data(cuit)
            
            if response.get('success'):
                data = response.get('taxpayer_data', {})
                return TaxpayerInfo(
                    cuit=cuit,
                    name=data.get('name', ''),
                    address=data.get('address', ''),
                    tax_category=data.get('tax_category', ''),
                    is_active=data.get('is_active', False),
                    vat_condition=data.get('vat_condition', '')
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error obteniendo información del contribuyente: {str(e)}")
            return None
    
    async def _consult_taxpayer_data(self, cuit: str) -> Dict[str, Any]:
        """Consultar datos de contribuyente."""
        try:
            # En una implementación real, usaría el servicio de consulta de contribuyentes
            # Por ahora, simular respuesta
            logger.warning("Consulta de contribuyente simulada - implementar servicio real")
            
            return {
                'success': True,
                'taxpayer_data': {
                    'name': 'Contribuyente Ejemplo',
                    'address': 'Dirección Ejemplo',
                    'tax_category': 'Responsable Inscripto',
                    'is_active': True,
                    'vat_condition': 'IVA Responsable Inscripto'
                }
            }
            
        except Exception as e:
            logger.error(f"Error consultando datos del contribuyente: {str(e)}")
            return {
                'success': False,
                'error_message': str(e)
            }
    
    def _is_authenticated(self) -> bool:
        """Verificar si está autenticado y el token no expiró."""
        return (
            self.token is not None and 
            self.sign is not None and 
            self.token_expiration is not None and 
            datetime.now() < self.token_expiration
        )
    
    async def generate_electronic_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generar factura electrónica y obtener CAE.
        """
        try:
            # Verificar autenticación
            if not self._is_authenticated():
                if not await self.authenticate():
                    return {
                        'success': False,
                        'error_message': 'No se pudo autenticar con AFIP'
                    }
            
            # Generar factura electrónica
            response = await self._request_cae(invoice_data)
            
            if response.get('success'):
                return {
                    'success': True,
                    'cae': response.get('cae'),
                    'expiration_date': response.get('expiration_date'),
                    'invoice_number': response.get('invoice_number'),
                    'point_of_sale': response.get('point_of_sale')
                }
            else:
                return {
                    'success': False,
                    'error_message': response.get('error_message', 'Error generando factura')
                }
                
        except Exception as e:
            logger.error(f"Error generando factura electrónica: {str(e)}")
            return {
                'success': False,
                'error_message': f'Error en generación: {str(e)}'
            }
    
    async def _request_cae(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Solicitar CAE para factura."""
        try:
            # Generar XML para solicitud de CAE
            soap_xml = self._generate_cae_request_xml(invoice_data)
            
            headers = {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://ar.gov.afip.dif.facturaelectronica/FECAESolicitar'
            }
            
            response = requests.post(
                self.base_url,
                data=soap_xml,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return self._parse_cae_response(response.content)
            else:
                return {
                    'success': False,
                    'error_message': f'Error HTTP: {response.status_code}'
                }
                
        except Exception as e:
            logger.error(f"Error solicitando CAE: {str(e)}")
            return {
                'success': False,
                'error_message': str(e)
            }
    
    def _generate_cae_request_xml(self, invoice_data: Dict[str, Any]) -> str:
        """Generar XML para solicitud de CAE."""
        # Implementación simplificada
        return f"""<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Header>
                <Auth>
                    <Token>{self.token}</Token>
                    <Sign>{self.sign}</Sign>
                    <Cuit>{self.credentials.cuit}</Cuit>
                </Auth>
            </soap:Header>
            <soap:Body>
                <FECAESolicitar xmlns="http://ar.gov.afip.dif.facturaelectronica/">
                    <FeCAEReq>
                        <FeCabReq>
                            <CantReg>1</CantReg>
                            <PtoVta>{invoice_data.get('point_of_sale', 1)}</PtoVta>
                            <CbteTipo>{invoice_data.get('invoice_type', 1)}</CbteTipo>
                        </FeCabReq>
                        <FeDetReq>
                            <FECAEDetRequest>
                                <Concepto>{invoice_data.get('concept', 1)}</Concepto>
                                <DocTipo>{invoice_data.get('document_type', 96)}</DocTipo>
                                <DocNro>{invoice_data.get('document_number', '')}</DocNro>
                                <CbteDesde>{invoice_data.get('invoice_from', 1)}</CbteDesde>
                                <CbteHasta>{invoice_data.get('invoice_to', 1)}</CbteHasta>
                                <CbteFch>{invoice_data.get('invoice_date', datetime.now().strftime('%Y%m%d'))}</CbteFch>
                                <ImpTotal>{invoice_data.get('total', 0)}</ImpTotal>
                                <ImpTotConc>0</ImpTotConc>
                                <ImpNeto>{invoice_data.get('net_amount', 0)}</ImpNeto>
                                <ImpOpEx>0</ImpOpEx>
                                <ImpTrib>0</ImpTrib>
                                <ImpIVA>{invoice_data.get('tax_amount', 0)}</ImpIVA>
                                <FchServDesde>{invoice_data.get('service_from', datetime.now().strftime('%Y%m%d'))}</FchServDesde>
                                <FchServHasta>{invoice_data.get('service_to', datetime.now().strftime('%Y%m%d'))}</FchServHasta>
                                <FchVtoPago>{invoice_data.get('payment_due', datetime.now().strftime('%Y%m%d'))}</FchVtoPago>
                                <MonId>PES</MonId>
                                <MonCotiz>1</MonCotiz>
                            </FECAEDetRequest>
                        </FeDetReq>
                    </FeCAEReq>
                </FECAESolicitar>
            </soap:Body>
        </soap:Envelope>"""
    
    def _parse_cae_response(self, xml_content: bytes) -> Dict[str, Any]:
        """Parsear respuesta de CAE."""
        try:
            root = ET.fromstring(xml_content)
            
            # Buscar errores
            errors = root.findall('.//Err')
            if errors:
                error_msg = errors[0].find('Msg').text if errors[0].find('Msg') is not None else 'Error desconocido'
                return {
                    'success': False,
                    'error_message': error_msg
                }
            
            # Buscar datos del CAE
            result = root.find('.//ResultGet')
            if result is not None:
                return {
                    'success': True,
                    'cae': result.find('CAE').text if result.find('CAE') is not None else None,
                    'expiration_date': result.find('CAEFchVto').text if result.find('CAEFchVto') is not None else None,
                    'invoice_number': result.find('CbteDesde').text if result.find('CbteDesde') is not None else None,
                    'point_of_sale': result.find('PtoVta').text if result.find('PtoVta') is not None else None
                }
            
            return {
                'success': False,
                'error_message': 'No se pudo obtener CAE'
            }
            
        except Exception as e:
            logger.error(f"Error parseando respuesta CAE: {str(e)}")
            return {
                'success': False,
                'error_message': f'Error parseando respuesta: {str(e)}'
            }

