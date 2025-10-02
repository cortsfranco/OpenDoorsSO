# Script de PowerShell para Gestión de Git - Open Doors Management System
# Este script proporciona un menú interactivo para todas las operaciones Git

param(
    [string]$Action = ""
)

function Show-Menu {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   Git Manager - Open Doors Management System" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Selecciona una opción:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Verificar estado del repositorio" -ForegroundColor Green
    Write-Host "2. Configurar repositorio Git (primera vez)" -ForegroundColor Green
    Write-Host "3. Commit y push con mensaje personalizado" -ForegroundColor Green
    Write-Host "4. Push rápido con mensaje estándar" -ForegroundColor Green
    Write-Host "5. Crear backup completo del proyecto" -ForegroundColor Green
    Write-Host "6. Ver logs y historial" -ForegroundColor Green
    Write-Host "7. Sincronizar con repositorio remoto" -ForegroundColor Green
    Write-Host "8. Salir" -ForegroundColor Red
    Write-Host ""
}

function Test-GitRepository {
    try {
        git status | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Show-GitStatus {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   Verificando Estado del Repositorio" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-GitRepository)) {
        Write-Host "Error: No se detectó un repositorio Git en este directorio." -ForegroundColor Red
        Write-Host ""
        $initRepo = Read-Host "¿Deseas inicializar un repositorio Git? (S/N)"
        if ($initRepo -eq "S" -or $initRepo -eq "s") {
            Setup-GitRepository
        }
        return
    }
    
    Write-Host "Estado actual del repositorio:" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    git status
    
    Write-Host ""
    Write-Host ""
    Write-Host "Información del repositorio remoto:" -ForegroundColor Yellow
    Write-Host "====================================" -ForegroundColor Yellow
    git remote -v
    
    Write-Host ""
    Write-Host ""
    Write-Host "Últimos commits:" -ForegroundColor Yellow
    Write-Host "================" -ForegroundColor Yellow
    git log --oneline -5
    
    Write-Host ""
    Write-Host ""
    Write-Host "Archivos modificados (detalle):" -ForegroundColor Yellow
    Write-Host "===============================" -ForegroundColor Yellow
    git diff --name-status
    
    Write-Host ""
    Write-Host ""
    $commitConfirm = Read-Host "¿Deseas hacer commit de los cambios? (S/N)"
    
    if ($commitConfirm -eq "S" -or $commitConfirm -eq "s") {
        Commit-AllChanges
    }
}

function Setup-GitRepository {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   Configuración del Repositorio Git" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar si ya existe un repositorio git
    if (Test-Path ".git") {
        Write-Host "Ya existe un repositorio Git en este directorio." -ForegroundColor Yellow
        Write-Host ""
        git remote -v
        Write-Host ""
        $reconfigure = Read-Host "¿Deseas reconfigurar el repositorio remoto? (S/N)"
        
        if ($reconfigure -ne "S" -and $reconfigure -ne "s") {
            Write-Host "Operación cancelada." -ForegroundColor Yellow
            Start-Sleep 2
            return
        }
        
        Write-Host ""
        Write-Host "Removiendo remote actual..." -ForegroundColor Yellow
        git remote remove origin
    }
    
    Write-Host ""
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Green
    git init
    
    Write-Host ""
    Write-Host "Configurando usuario Git..." -ForegroundColor Green
    git config user.name "Franco Cortes"
    git config user.email "cortsfranco@hotmail.com"
    
    Write-Host ""
    Write-Host "Agregando archivo .gitignore..." -ForegroundColor Green
    if (-not (Test-Path ".gitignore")) {
        Create-GitIgnore
    }
    
    Write-Host ""
    Write-Host "Agregando repositorio remoto de GitHub..." -ForegroundColor Green
    git remote add origin "https://github.com/cortsfranco/OpenDoorsSO.git"
    
    Write-Host ""
    Write-Host "Agregando todos los archivos al repositorio..." -ForegroundColor Green
    git add .
    
    Write-Host ""
    Write-Host "Haciendo el commit inicial..." -ForegroundColor Green
    git commit -m "Initial commit: Open Doors Management System with enhanced features"
    
    Write-Host ""
    $pushConfirm = Read-Host "¿Deseas hacer push al repositorio remoto? (S/N)"
    
    if ($pushConfirm -eq "S" -or $pushConfirm -eq "s") {
        Write-Host ""
        Write-Host "Haciendo push al repositorio remoto..." -ForegroundColor Green
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "¡Repositorio configurado exitosamente!" -ForegroundColor Green
            Write-Host "Tu código está ahora disponible en: https://github.com/cortsfranco/OpenDoorsSO.git" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "Error: No se pudo hacer push al repositorio." -ForegroundColor Red
            Write-Host "Verifica tu conexión a internet y tus credenciales de GitHub." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Puedes intentar hacer push manualmente con:" -ForegroundColor Yellow
            Write-Host "  git push -u origin main" -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "Repositorio local configurado. Puedes hacer push más tarde con:" -ForegroundColor Yellow
        Write-Host "  git push -u origin main" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Configuración completada." -ForegroundColor Green
    Start-Sleep 3
}

function Create-GitIgnore {
    $gitIgnoreContent = @"
# Archivos de configuración local
.env
.env.local
.env.*.local

# Dependencias
node_modules/
__pycache__/
*.pyc

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Python
*.py[cod]
*`$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# pyenv
.python-version

# celery beat schedule file
celerybeat-schedule

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.docker/

# Alembic
alembic/versions/*.py
!alembic/versions/__init__.py

# Archivos temporales
*.tmp
*.temp

# Archivos de backup
*.bak
*.backup

# Archivos de test
test_*.py
*_test.py
tests/

# Archivos de configuración local
docker-compose.override.yml
"@
    
    $gitIgnoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "¡Archivo .gitignore creado!" -ForegroundColor Green
}

function Commit-AllChanges {
    if (-not (Test-GitRepository)) {
        Write-Host "Error: No se detectó un repositorio Git." -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "Agregando todos los archivos al staging area..." -ForegroundColor Green
    git add .
    
    Write-Host ""
    $commitMsg = Read-Host "Ingresa el mensaje de commit"
    
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Open Doors Management System"
    }
    
    Write-Host ""
    Write-Host "Haciendo commit con mensaje: $commitMsg" -ForegroundColor Green
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Commit realizado exitosamente." -ForegroundColor Green
        Write-Host ""
        Write-Host "Haciendo push al repositorio remoto..." -ForegroundColor Green
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "¡Push realizado exitosamente!" -ForegroundColor Green
            Write-Host "Todos los cambios han sido subidos al repositorio." -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "Error: No se pudo hacer push al repositorio." -ForegroundColor Red
            Write-Host "Verifica tu conexión a internet y tus credenciales de Git." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "Error: No se pudo realizar el commit." -ForegroundColor Red
        Write-Host "Verifica que hay cambios para commitear." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Quick-Push {
    if (-not (Test-GitRepository)) {
        Write-Host "Error: No se detectó un repositorio Git." -ForegroundColor Red
        return
    }
    
    Write-Host "Agregando todos los archivos..." -ForegroundColor Green
    git add .
    
    Write-Host ""
    $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Open Doors Management System"
    Write-Host "Haciendo commit con mensaje estándar..." -ForegroundColor Green
    
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Commit realizado. Haciendo push..." -ForegroundColor Green
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "¡Push exitoso! Cambios subidos al repositorio." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Error en el push. Verifica tu conexión." -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "No hay cambios para commitear." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Logs {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   Logs y Historial del Repositorio" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-GitRepository)) {
        Write-Host "Error: No se detectó un repositorio Git." -ForegroundColor Red
        return
    }
    
    Write-Host "Últimos 10 commits:" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    git log --oneline -10
    
    Write-Host ""
    Write-Host ""
    Write-Host "Estadísticas del repositorio:" -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Yellow
    git log --stat --oneline -5
    
    Write-Host ""
    Write-Host ""
    $viewDetails = Read-Host "¿Deseas ver detalles de un commit específico? (S/N)"
    
    if ($viewDetails -eq "S" -or $viewDetails -eq "s") {
        Write-Host ""
        $commitHash = Read-Host "Ingresa el hash del commit (primeros 7 caracteres)"
        Write-Host ""
        git show --stat $commitHash
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Sync-Repository {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   Sincronización con Repositorio Remoto" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-GitRepository)) {
        Write-Host "Error: No se detectó un repositorio Git." -ForegroundColor Red
        return
    }
    
    Write-Host "Verificando cambios remotos..." -ForegroundColor Green
    git fetch origin
    
    Write-Host ""
    Write-Host "Comparando con rama remota..." -ForegroundColor Green
    git status -uno
    
    Write-Host ""
    $pullConfirm = Read-Host "¿Deseas hacer pull de cambios remotos? (S/N)"
    
    if ($pullConfirm -eq "S" -or $pullConfirm -eq "s") {
        Write-Host ""
        Write-Host "Descargando cambios remotos..." -ForegroundColor Green
        git pull origin main
    }
    
    Write-Host ""
    $pushConfirm = Read-Host "¿Deseas hacer push de cambios locales? (S/N)"
    
    if ($pushConfirm -eq "S" -or $pushConfirm -eq "s") {
        Write-Host ""
        Write-Host "Subiendo cambios locales..." -ForegroundColor Green
        git push origin main
    }
    
    Write-Host ""
    Write-Host "Sincronización completada." -ForegroundColor Green
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Función principal
function Main {
    if ($Action -ne "") {
        switch ($Action.ToLower()) {
            "status" { Show-GitStatus; return }
            "setup" { Setup-GitRepository; return }
            "commit" { Commit-AllChanges; return }
            "quick" { Quick-Push; return }
            "logs" { Show-Logs; return }
            "sync" { Sync-Repository; return }
            default { Write-Host "Acción no reconocida: $Action" -ForegroundColor Red; return }
        }
    }
    
    do {
        Show-Menu
        $choice = Read-Host "Ingresa tu opción (1-8)"
        
        switch ($choice) {
            "1" { Show-GitStatus }
            "2" { Setup-GitRepository }
            "3" { Commit-AllChanges }
            "4" { Quick-Push }
            "5" { Write-Host "Función de backup no implementada en PowerShell aún." -ForegroundColor Yellow; Start-Sleep 2 }
            "6" { Show-Logs }
            "7" { Sync-Repository }
            "8" { 
                Write-Host ""
                Write-Host "Gracias por usar Git Manager." -ForegroundColor Cyan
                Write-Host "¡Hasta luego!" -ForegroundColor Green
                return 
            }
            default { 
                Write-Host "Opción inválida. Por favor, selecciona una opción del 1 al 8." -ForegroundColor Red
                Start-Sleep 2
            }
        }
    } while ($true)
}

# Ejecutar función principal
Main
