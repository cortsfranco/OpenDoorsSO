#!/bin/bash

# Script para configurar el VPS de Hostinger para Open Doors
# Este script instala Docker, configura usuarios y prepara el entorno de producción

set -e

echo "🚀 Configurando VPS de Hostinger para Open Doors..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

print_status "Actualizando sistema..."
apt update && apt upgrade -y

print_status "Instalando dependencias básicas..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    unzip \
    htop \
    nano \
    ufw

# Instalar Docker
print_status "Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Instalar Docker Compose
print_status "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Crear usuario para la aplicación
print_status "Creando usuario de aplicación..."
APP_USER="opendoors"
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG docker "$APP_USER"
    print_status "Usuario $APP_USER creado y agregado al grupo docker"
else
    print_warning "El usuario $APP_USER ya existe"
fi

# Configurar directorio de la aplicación
print_status "Configurando directorio de aplicación..."
APP_DIR="/opt/opendoors"
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

# Configurar firewall
print_status "Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Para acceso directo a la API si es necesario
ufw --force enable

print_status "Firewall configurado correctamente"

# Configurar Docker para iniciar automáticamente
print_status "Configurando Docker para inicio automático..."
systemctl enable docker
systemctl start docker

# Crear directorio para logs
print_status "Creando directorio para logs..."
mkdir -p /var/log/opendoors
chown "$APP_USER:$APP_USER" /var/log/opendoors

# Configurar logrotate para Docker
print_status "Configurando logrotate..."
cat > /etc/logrotate.d/docker << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Configurar monitoreo básico
print_status "Configurando monitoreo básico..."
cat > /etc/systemd/system/opendoors-health.service << EOF
[Unit]
Description=Open Doors Health Check
After=docker.service

[Service]
Type=oneshot
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml ps
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable opendoors-health.service

# Crear script de backup
print_status "Creando script de backup..."
cat > /usr/local/bin/opendoors-backup << 'EOF'
#!/bin/bash
# Script de backup para Open Doors

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/opendoors_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "Creando backup de base de datos..."
docker-compose -f /opt/opendoors/docker-compose.prod.yml exec -T db pg_dump -U opendoors_user -d opendoors_db > "$BACKUP_FILE"

echo "Backup creado: $BACKUP_FILE"

# Mantener solo los últimos 7 backups
find "$BACKUP_DIR" -name "opendoors_backup_*.sql" -mtime +7 -delete

echo "Backup completado"
EOF

chmod +x /usr/local/bin/opendoors-backup

# Configurar backup automático con cron
print_status "Configurando backup automático..."
echo "0 2 * * * $APP_USER /usr/local/bin/opendoors-backup" >> /etc/crontab

# Crear script de monitoreo de recursos
print_status "Creando script de monitoreo..."
cat > /usr/local/bin/opendoors-monitor << 'EOF'
#!/bin/bash
# Script de monitoreo para Open Doors

echo "=== Open Doors - Estado del Sistema ==="
echo "Fecha: $(date)"
echo ""

echo "=== Uso de Disco ==="
df -h

echo ""
echo "=== Uso de Memoria ==="
free -h

echo ""
echo "=== Estado de Docker ==="
docker ps

echo ""
echo "=== Estado de la Aplicación ==="
cd /opt/opendoors
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=== Logs Recientes (últimas 20 líneas) ==="
docker-compose -f docker-compose.prod.yml logs --tail=20
EOF

chmod +x /usr/local/bin/opendoors-monitor

# Configurar límites del sistema
print_status "Configurando límites del sistema..."
cat >> /etc/security/limits.conf << EOF
# Open Doors limits
$APP_USER soft nofile 65536
$APP_USER hard nofile 65536
$APP_USER soft nproc 65536
$APP_USER hard nproc 65536
EOF

# Configurar kernel parameters para Docker
print_status "Configurando parámetros del kernel..."
cat >> /etc/sysctl.conf << EOF
# Open Doors kernel parameters
vm.max_map_count=262144
fs.file-max=2097152
EOF

sysctl -p

# Crear archivo de configuración de ejemplo
print_status "Creando archivo de configuración de ejemplo..."
cat > "$APP_DIR/.env.example" << EOF
# Configuración de producción para Open Doors
POSTGRES_USER=opendoors_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=opendoors_db

SECRET_KEY=your-very-secure-secret-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
OPENAI_API_VERSION=2024-02-01

# Azure Document Intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=your-azure-doc-intelligence-key

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_ADMIN_KEY=your-azure-search-key
AZURE_SEARCH_INDEX_NAME=opendoors-invoices

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-azure-storage-key

# AFIP
AFIP_TAX_ID=your-afip-tax-id
AFIP_CERTIFICATE_PATH=/opt/opendoors/certs/certificate.crt
AFIP_PRIVATE_KEY_PATH=/opt/opendoors/certs/private.key

# Frontend
FRONTEND_API_URL=https://your-domain.com/api
GITHUB_REPOSITORY=your-username/opendoors-so
GITHUB_SHA=latest
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/.env.example"

# Crear directorio para certificados
mkdir -p "$APP_DIR/certs"
chown "$APP_USER:$APP_USER" "$APP_DIR/certs"
chmod 700 "$APP_DIR/certs"

print_status "✅ Configuración del VPS completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copiar el código fuente a $APP_DIR"
echo "2. Configurar el archivo .env con tus credenciales"
echo "3. Ejecutar: docker-compose -f docker-compose.prod.yml up -d"
echo "4. Ejecutar las migraciones de base de datos"
echo ""
echo "🔧 Comandos útiles:"
echo "- Monitorear sistema: opendoors-monitor"
echo "- Crear backup: opendoors-backup"
echo "- Ver logs: docker-compose -f $APP_DIR/docker-compose.prod.yml logs"
echo ""
echo "⚠️  Recuerda:"
echo "- Configurar SSL/TLS para HTTPS"
echo "- Actualizar el archivo .env con credenciales reales"
echo "- Configurar dominio DNS apuntando a este servidor"
