#!/usr/bin/env python3
"""
Script para migrar datos de base de datos local a producción.
Implementa el plan de migración detallado en el roadmap.
"""

import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional


class DatabaseMigrator:
    """Clase para manejar la migración de base de datos."""
    
    def __init__(self, local_db_url: str, production_host: str, production_user: str):
        """
        Inicializa el migrador de base de datos.
        
        Args:
            local_db_url: URL de la base de datos local
            production_host: Host del servidor de producción
            production_user: Usuario para conexión SSH
        """
        self.local_db_url = local_db_url
        self.production_host = production_host
        self.production_user = production_user
    
    def create_database_dump(self) -> Path:
        """
        Crea un volcado de la base de datos local.
        
        Returns:
            Ruta al archivo de volcado creado
        """
        print("📦 Creando volcado de la base de datos local...")
        
        # Extraer componentes de la URL
        # postgresql://user:password@host:port/database
        url_parts = self.local_db_url.replace("postgresql://", "").split("/")
        db_name = url_parts[-1]
        auth_host = url_parts[0].split("@")
        
        if len(auth_host) != 2:
            raise ValueError("Formato de URL de base de datos inválido")
        
        user_pass = auth_host[0].split(":")
        if len(user_pass) != 2:
            raise ValueError("Formato de URL de base de datos inválido")
        
        username = user_pass[0]
        password = user_pass[1]
        host_port = auth_host[1].split(":")
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "5432"
        
        # Crear archivo temporal para el volcado
        dump_file = Path(tempfile.gettempdir()) / f"opendoors_backup_{db_name}.sql"
        
        # Configurar variables de entorno para pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = password
        
        # Comando pg_dump
        cmd = [
            "pg_dump",
            "-h", host,
            "-p", port,
            "-U", username,
            "-d", db_name,
            "-f", str(dump_file),
            "--verbose",
            "--no-password"
        ]
        
        try:
            subprocess.run(cmd, env=env, check=True, capture_output=True)
            print(f"✅ Volcado creado exitosamente: {dump_file}")
            return dump_file
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al crear el volcado: {e}")
            print(f"Stderr: {e.stderr.decode()}")
            raise
    
    def preprocess_dump(self, dump_file: Path, production_username: str) -> Path:
        """
        Preprocesa el archivo de volcado para producción.
        
        Args:
            dump_file: Ruta al archivo de volcado
            production_username: Nombre de usuario de producción
            
        Returns:
            Ruta al archivo procesado
        """
        print("🔧 Procesando volcado para producción...")
        
        processed_file = dump_file.parent / f"{dump_file.stem}_processed.sql"
        
        # Leer el archivo original
        with open(dump_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar declaraciones de ownership
        processed_content = content.replace(
            "OWNER TO postgres;",
            f"OWNER TO {production_username};"
        )
        
        # Escribir el archivo procesado
        with open(processed_file, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        
        print(f"✅ Volcado procesado: {processed_file}")
        return processed_file
    
    def transfer_to_production(self, dump_file: Path) -> str:
        """
        Transfiere el archivo de volcado al servidor de producción.
        
        Args:
            dump_file: Ruta al archivo de volcado
            
        Returns:
            Ruta del archivo en el servidor de producción
        """
        print(f"🚀 Transfiriendo {dump_file.name} al servidor de producción...")
        
        remote_path = f"/opt/opendoors/{dump_file.name}"
        
        # Comando scp
        cmd = [
            "scp",
            str(dump_file),
            f"{self.production_user}@{self.production_host}:{remote_path}"
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"✅ Archivo transferido a: {remote_path}")
            return remote_path
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al transferir archivo: {e}")
            print(f"Stderr: {e.stderr.decode()}")
            raise
    
    def restore_on_production(self, remote_dump_file: str, production_db_config: dict):
        """
        Restaura el volcado en la base de datos de producción.
        
        Args:
            remote_dump_file: Ruta del archivo de volcado en el servidor
            production_db_config: Configuración de la base de datos de producción
        """
        print("🔄 Restaurando base de datos en producción...")
        
        # Comando SSH para restaurar
        restore_cmd = f"""
        cd /opt/opendoors
        cat {remote_dump_file} | docker-compose exec -T db psql -U {production_db_config['user']} -d {production_db_config['database']}
        """
        
        cmd = [
            "ssh",
            f"{self.production_user}@{self.production_host}",
            restore_cmd
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print("✅ Base de datos restaurada exitosamente")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al restaurar base de datos: {e}")
            print(f"Stderr: {e.stderr.decode()}")
            raise
    
    def cleanup_remote_file(self, remote_dump_file: str):
        """
        Limpia el archivo de volcado del servidor de producción.
        
        Args:
            remote_dump_file: Ruta del archivo de volcado en el servidor
        """
        print("🧹 Limpiando archivos temporales en producción...")
        
        cmd = [
            "ssh",
            f"{self.production_user}@{self.production_host}",
            f"rm -f {remote_dump_file}"
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print("✅ Archivos temporales eliminados")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Advertencia: No se pudo eliminar el archivo temporal: {e}")
    
    def migrate(self, production_db_config: dict, production_username: str):
        """
        Ejecuta el proceso completo de migración.
        
        Args:
            production_db_config: Configuración de la base de datos de producción
            production_username: Nombre de usuario de producción
        """
        print("🚀 Iniciando migración de base de datos...")
        
        try:
            # 1. Crear volcado local
            dump_file = self.create_database_dump()
            
            # 2. Procesar volcado
            processed_file = self.preprocess_dump(dump_file, production_username)
            
            # 3. Transferir a producción
            remote_file = self.transfer_to_production(processed_file)
            
            # 4. Restaurar en producción
            self.restore_on_production(remote_file, production_db_config)
            
            # 5. Limpiar archivos temporales
            self.cleanup_remote_file(remote_file)
            
            # Limpiar archivos locales
            dump_file.unlink()
            processed_file.unlink()
            
            print("🎉 Migración completada exitosamente!")
            
        except Exception as e:
            print(f"❌ Error durante la migración: {e}")
            raise


def main():
    """Función principal para ejecutar la migración."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrar base de datos de Open Doors")
    parser.add_argument("--local-db-url", required=True, help="URL de la base de datos local")
    parser.add_argument("--production-host", required=True, help="Host del servidor de producción")
    parser.add_argument("--production-user", required=True, help="Usuario SSH para producción")
    parser.add_argument("--production-db-user", required=True, help="Usuario de base de datos de producción")
    parser.add_argument("--production-db-name", required=True, help="Nombre de la base de datos de producción")
    
    args = parser.parse_args()
    
    migrator = DatabaseMigrator(
        local_db_url=args.local_db_url,
        production_host=args.production_host,
        production_user=args.production_user
    )
    
    production_db_config = {
        "user": args.production_db_user,
        "database": args.production_db_name
    }
    
    migrator.migrate(production_db_config, args.production_db_user)


if __name__ == "__main__":
    main()
