"""
Servicio de autenticación y gestión de usuarios.

Este módulo implementa la lógica de autenticación segura para el sistema Open Doors,
siguiendo las mejores prácticas de seguridad para APIs de FastAPI.

Características de seguridad implementadas:
- Hashing seguro de contraseñas con bcrypt
- Tokens JWT con expiración configurable
- Manejo robusto de excepciones JWT
- Validación de entrada estricta
- Tipado estático completo
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

from src.core.config import settings


class AuthService:
    """
    Servicio de autenticación modular y seguro.
    
    Esta clase encapsula toda la lógica de autenticación de usuarios,
    incluyendo la gestión de contraseñas y la creación/verificación de tokens JWT.
    
    Características:
    - Métodos estáticos para máxima modularidad
    - Sin dependencias directas de FastAPI
    - Hashing seguro con bcrypt
    - Tokens JWT con configuración flexible
    - Manejo robusto de errores
    """
    
    # Configuración de contexto de hash de contraseñas
    # bcrypt es considerado el estándar de oro para hashing de contraseñas
    _pwd_context = CryptContext(
        schemes=["bcrypt"], 
        deprecated="auto",
        bcrypt__rounds=12  # 12 rounds para balance entre seguridad y rendimiento
    )
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Compara una contraseña en texto plano con su hash almacenado.
        
        Este método implementa verificación segura de contraseñas usando bcrypt,
        que es resistente a ataques de fuerza bruta y timing attacks.
        
        Args:
            plain_password: Contraseña en texto plano proporcionada por el usuario
            hashed_password: Hash almacenado en la base de datos
            
        Returns:
            bool: True si la contraseña coincide, False en caso contrario
            
        Security Notes:
            - Usa bcrypt que es resistente a ataques de timing
            - No revela información sobre el hash en caso de fallo
            - Implementa salt automático para prevenir rainbow tables
        """
        if not plain_password or not hashed_password:
            return False
            
        try:
            return AuthService._pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # En caso de cualquier error en la verificación, retornar False
            # Esto previene ataques de timing y revelación de información
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Genera un hash seguro para una nueva contraseña.
        
        Este método crea un hash bcrypt con salt automático,
        asegurando que cada hash sea único incluso para contraseñas idénticas.
        
        Args:
            password: Contraseña en texto plano a hashear
            
        Returns:
            str: Hash bcrypt de la contraseña
            
        Raises:
            ValueError: Si la contraseña está vacía o es None
            
        Security Notes:
            - Usa bcrypt con 12 rounds (configurable)
            - Salt automático para cada hash
            - Resistente a ataques de fuerza bruta
            - Compatible con la mayoría de sistemas de autenticación
        """
        if not password or not isinstance(password, str):
            raise ValueError("La contraseña debe ser una cadena no vacía")
        
        if len(password.strip()) == 0:
            raise ValueError("La contraseña no puede estar vacía")
            
        return AuthService._pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """
        Crea un nuevo token de acceso JWT.
        
        Este método genera un token JWT seguro con tiempo de expiración
        configurable y firma digital usando el SECRET_KEY de la aplicación.
        
        Args:
            data: Diccionario con los datos a incluir en el token
                 Debe incluir al menos 'sub' (subject/user ID)
            
        Returns:
            str: Token JWT codificado y firmado
            
        Raises:
            ValueError: Si los datos no contienen 'sub' o son inválidos
            KeyError: Si SECRET_KEY no está configurado
            
        Security Notes:
            - Usa HMAC-SHA256 para firma (configurable)
            - Tiempo de expiración configurable via settings
            - Incluye timestamp de emisión (iat)
            - Datos sensibles no deben incluirse en el token
        """
        if not isinstance(data, dict):
            raise ValueError("Los datos del token deben ser un diccionario")
        
        if "sub" not in data:
            raise ValueError("Los datos del token deben incluir 'sub' (subject)")
        
        if not settings.SECRET_KEY:
            raise KeyError("SECRET_KEY no está configurado en las configuraciones")
        
        # Crear una copia de los datos para no modificar el original
        to_encode = data.copy()
        
        # Calcular tiempo de expiración
        expire_time = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        # Agregar campos estándar de JWT
        to_encode.update({
            "exp": expire_time,  # Tiempo de expiración
            "iat": datetime.utcnow(),  # Tiempo de emisión
            "type": "access"  # Tipo de token para diferenciación
        })
        
        try:
            # Codificar y firmar el token
            encoded_jwt = jwt.encode(
                to_encode,
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM
            )
            return encoded_jwt
        except Exception as e:
            # Manejo genérico de errores de codificación
            raise RuntimeError(f"Error al crear token JWT: {str(e)}")
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decodifica un token JWT y valida su autenticidad.
        
        Este método decodifica y verifica un token JWT, validando:
        - Firma digital del token
        - Tiempo de expiración
        - Formato correcto del token
        - Algoritmo de firma
        
        Args:
            token: Token JWT a decodificar y validar
            
        Returns:
            Dict[str, Any]: Payload decodificado del token
            
        Raises:
            ValueError: Si el token está vacío o es inválido
            JWTError: Si el token es inválido, expirado o malformado
            KeyError: Si SECRET_KEY no está configurado
            
        Security Notes:
            - Valida la firma digital para prevenir tampering
            - Verifica expiración automáticamente
            - Usa el mismo algoritmo que se usó para firmar
            - Manejo robusto de excepciones JWT
        """
        if not token or not isinstance(token, str):
            raise ValueError("El token debe ser una cadena no vacía")
        
        if not settings.SECRET_KEY:
            raise KeyError("SECRET_KEY no está configurado en las configuraciones")
        
        # Limpiar el token de espacios y prefijos comunes
        token = token.strip()
        if token.startswith("Bearer "):
            token = token[7:]  # Remover prefijo "Bearer "
        
        try:
            # Decodificar y verificar el token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            
            # Validaciones adicionales del payload
            if not isinstance(payload, dict):
                raise JWTError("Payload del token inválido")
            
            # Verificar que el token no esté expirado (jose lo hace automáticamente)
            # pero podemos agregar validaciones adicionales aquí
            if "exp" in payload:
                exp_timestamp = payload["exp"]
                if isinstance(exp_timestamp, (int, float)):
                    exp_datetime = datetime.fromtimestamp(exp_timestamp)
                    if exp_datetime < datetime.utcnow():
                        raise JWTError("Token expirado")
            
            return payload
            
        except JWTError as e:
            # Re-raise JWTError para manejo específico en capas superiores
            raise JWTError(f"Token JWT inválido: {str(e)}")
        except Exception as e:
            # Manejo de errores inesperados
            raise RuntimeError(f"Error al decodificar token: {str(e)}")
    
    @staticmethod
    def extract_user_id_from_token(token: str) -> Optional[int]:
        """
        Extrae el ID del usuario desde un token JWT.
        
        Método de conveniencia para obtener el subject (user ID) del token.
        
        Args:
            token: Token JWT del cual extraer el user ID
            
        Returns:
            Optional[int]: ID del usuario si el token es válido, None en caso contrario
        """
        try:
            payload = AuthService.decode_token(token)
            user_id = payload.get("sub")
            
            if user_id and isinstance(user_id, (str, int)):
                return int(user_id)
            return None
            
        except (JWTError, ValueError, TypeError):
            return None
    
    @staticmethod
    def is_token_expired(token: str) -> bool:
        """
        Verifica si un token JWT está expirado sin decodificarlo completamente.
        
        Args:
            token: Token JWT a verificar
            
        Returns:
            bool: True si el token está expirado, False en caso contrario
        """
        try:
            payload = AuthService.decode_token(token)
            exp_timestamp = payload.get("exp")
            
            if exp_timestamp and isinstance(exp_timestamp, (int, float)):
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                return exp_datetime < datetime.utcnow()
            
            return False
            
        except (JWTError, ValueError, TypeError):
            return True  # Considerar expirado si hay cualquier error
