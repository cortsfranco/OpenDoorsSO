-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear usuario para la aplicación (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'opendoors_user') THEN
        CREATE ROLE opendoors_user WITH LOGIN PASSWORD 'opendoors_password';
    END IF;
END
$$;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE opendoors_db TO opendoors_user;

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO opendoors_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO opendoors_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO opendoors_user;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO opendoors_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO opendoors_user;
