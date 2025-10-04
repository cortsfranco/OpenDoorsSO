-- ============================================
-- OPEN DOORS - Script de Inicialización de Base de Datos
-- ============================================
-- Este script se ejecuta automáticamente al crear el contenedor PostgreSQL

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar encoding y collation
ALTER DATABASE opendoors_db SET client_encoding TO 'UTF8';
ALTER DATABASE opendoors_db SET lc_messages TO 'en_US.UTF-8';
ALTER DATABASE opendoors_db SET lc_monetary TO 'en_US.UTF-8';
ALTER DATABASE opendoors_db SET lc_numeric TO 'en_US.UTF-8';
ALTER DATABASE opendoors_db SET lc_time TO 'en_US.UTF-8';

-- Crear schema por defecto (las tablas las crea SQLAlchemy)
CREATE SCHEMA IF NOT EXISTS public;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos Open Doors inicializada correctamente';
    RAISE NOTICE 'ℹ️  Extensiones habilitadas: uuid-ossp, pg_trgm';
    RAISE NOTICE 'ℹ️  Encoding: UTF-8';
END $$;
