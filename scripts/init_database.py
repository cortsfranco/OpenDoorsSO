#!/usr/bin/env python3
"""
Script consolidado para inicializar la base de datos.
Reemplaza init_db.py y otros scripts de setup de BD.
"""

import asyncio
import os
import sys
from pathlib import Path

# Agregar el directorio src al path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv
from src.core.database import init_db, engine, AsyncSessionLocal
from src.core.config import settings

# Cargar variables de entorno
load_dotenv()

async def check_database_connection():
    """Verificar conexión a la base de datos."""
    
    print("🔍 Verificando conexión a la base de datos...")
    
    try:
        # Intentar conectar
        async with engine.begin() as conn:
            result = await conn.execute("SELECT version();")
            version = result.scalar()
            print(f"✅ Conectado a PostgreSQL: {version}")
            return True
            
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False

async def initialize_database():
    """Inicializar base de datos creando todas las tablas."""
    
    print("\n🏗️  Inicializando base de datos...")
    
    try:
        # Crear todas las tablas
        await init_db()
        print("✅ Tablas creadas exitosamente.")
        
        # Verificar que las tablas existen
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            
            # Listar tablas creadas
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            print(f"\n📋 Tablas creadas ({len(tables)}):")
            for table in tables:
                print(f"   • {table}")
                
        return True
        
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")
        return False

async def verify_models():
    """Verificar que todos los modelos están correctamente configurados."""
    
    print("\n🔍 Verificando modelos...")
    
    try:
        from src.models import user, invoice, partner, system_settings, activity_log
        
        models = [user.User, invoice.Invoice, partner.Partner, 
                 system_settings.SystemSettings, activity_log.ActivityLog]
        
        print(f"✅ {len(models)} modelos cargados correctamente:")
        for model in models:
            print(f"   • {model.__name__}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error verificando modelos: {e}")
        return False

async def check_migrations():
    """Verificar estado de migraciones Alembic."""
    
    print("\n🔄 Verificando migraciones...")
    
    try:
        from alembic.config import Config
        from alembic import command
        from alembic.runtime.environment import EnvironmentContext
        from alembic.script import ScriptDirectory
        
        # Configurar Alembic
        alembic_cfg = Config("alembic.ini")
        script = ScriptDirectory.from_config(alembic_cfg)
        
        # Obtener versión actual
        async with engine.connect() as conn:
            context = EnvironmentContext(
                config=alembic_cfg,
                script=script
            )
            context.configure(connection=conn)
            
            with context.begin_transaction():
                current_rev = context.get_current_revision()
                head_rev = script.get_current_head()
                
                print(f"   Versión actual: {current_rev or 'No aplicada'}")
                print(f"   Versión head: {head_rev}")
                
                if current_rev == head_rev:
                    print("✅ Base de datos actualizada.")
                    return True
                else:
                    print("⚠️  Hay migraciones pendientes.")
                    print("   Ejecuta: alembic upgrade head")
                    return False
                    
    except Exception as e:
        print(f"❌ Error verificando migraciones: {e}")
        return False

async def main():
    """Función principal."""
    
    print("=" * 60)
    print("   INICIALIZACIÓN DE BASE DE DATOS - OPEN DOORS")
    print("=" * 60)
    
    # Verificar variables de entorno
    required_vars = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "POSTGRES_SERVER"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Variables de entorno faltantes: {', '.join(missing_vars)}")
        print("   Asegúrate de tener un archivo .env configurado.")
        sys.exit(1)
    
    # Mostrar configuración
    print(f"\n📋 Configuración de base de datos:")
    print(f"   Host: {os.getenv('POSTGRES_SERVER')}")
    print(f"   Puerto: {os.getenv('POSTGRES_PORT', '5432')}")
    print(f"   Base de datos: {os.getenv('POSTGRES_DB')}")
    print(f"   Usuario: {os.getenv('POSTGRES_USER')}")
    
    # Verificar conexión
    if not await check_database_connection():
        print("\n💡 Sugerencias:")
        print("   • Verifica que Docker esté corriendo")
        print("   • Verifica que el contenedor de PostgreSQL esté activo")
        print("   • Verifica las credenciales en el archivo .env")
        sys.exit(1)
    
    # Inicializar base de datos
    if not await initialize_database():
        sys.exit(1)
    
    # Verificar modelos
    if not await verify_models():
        sys.exit(1)
    
    # Verificar migraciones
    migrations_ok = await check_migrations()
    
    print("\n" + "=" * 60)
    print("   INICIALIZACIÓN COMPLETADA")
    print("=" * 60)
    
    if not migrations_ok:
        print("\n⚠️  Acción requerida:")
        print("   Ejecuta: alembic upgrade head")
        print("   Para aplicar migraciones pendientes.")
    else:
        print("\n✅ Base de datos lista para usar.")
        print("\n🚀 Próximos pasos:")
        print("   1. Ejecuta: python scripts/create_admin.py")
        print("   2. Ejecuta: docker-compose up")
        print("   3. Visita: http://localhost:3000")

if __name__ == "__main__":
    asyncio.run(main())
