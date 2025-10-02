@echo off
REM --- Script para configurar el repositorio Git ---
REM Este script inicializa Git, agrega el remote y hace el primer push

cls
echo ===============================================
echo   Configuracion Inicial del Repositorio Git
echo ===============================================
echo.

REM Verificar si ya existe un repositorio git
if exist ".git" (
  echo Ya existe un repositorio Git en este directorio.
  echo.
  git remote -v
  echo.
  echo ¿Deseas reconfigurar el repositorio remoto? (S/N)
  set /p reconfigure="Respuesta: "
  
  if /i "%reconfigure%" neq "S" (
    echo Operacion cancelada.
    pause
    exit /b
  )
  
  echo.
  echo Removiendo remote actual...
  git remote remove origin
)

echo.
echo Inicializando repositorio Git...
git init

echo.
echo Configurando usuario Git (si no esta configurado globalmente)...
git config user.name "Franco Cortes"
git config user.email "cortsfranco@hotmail.com"

echo.
echo Agregando archivo .gitignore...
if not exist ".gitignore" (
  echo # Archivos de configuracion local > .gitignore
  echo .env >> .gitignore
  echo .env.local >> .gitignore
  echo .env.*.local >> .gitignore
  echo >> .gitignore
  echo # Dependencias >> .gitignore
  echo node_modules/ >> .gitignore
  echo __pycache__/ >> .gitignore
  echo *.pyc >> .gitignore
  echo >> .gitignore
  echo # Logs >> .gitignore
  echo logs >> .gitignore
  echo *.log >> .gitignore
  echo npm-debug.log* >> .gitignore
  echo yarn-debug.log* >> .gitignore
  echo yarn-error.log* >> .gitignore
  echo >> .gitignore
  echo # Runtime data >> .gitignore
  echo pids >> .gitignore
  echo *.pid >> .gitignore
  echo *.seed >> .gitignore
  echo *.pid.lock >> .gitignore
  echo >> .gitignore
  echo # Coverage directory used by tools like istanbul >> .gitignore
  echo coverage/ >> .gitignore
  echo >> .gitignore
  echo # nyc test coverage >> .gitignore
  echo .nyc_output >> .gitignore
  echo >> .gitignore
  echo # Grunt intermediate storage >> .gitignore
  echo .grunt >> .gitignore
  echo >> .gitignore
  echo # Bower dependency directory >> .gitignore
  echo bower_components >> .gitignore
  echo >> .gitignore
  echo # node-waf configuration >> .gitignore
  echo .lock-wscript >> .gitignore
  echo >> .gitignore
  echo # Compiled binary addons >> .gitignore
  echo build/Release >> .gitignore
  echo >> .gitignore
  echo # Dependency directories >> .gitignore
  echo jspm_packages/ >> .gitignore
  echo >> .gitignore
  echo # Optional npm cache directory >> .gitignore
  echo .npm >> .gitignore
  echo >> .gitignore
  echo # Optional REPL history >> .gitignore
  echo .node_repl_history >> .gitignore
  echo >> .gitignore
  echo # Output of 'npm pack' >> .gitignore
  echo *.tgz >> .gitignore
  echo >> .gitignore
  echo # Yarn Integrity file >> .gitignore
  echo .yarn-integrity >> .gitignore
  echo >> .gitignore
  echo # dotenv environment variables file >> .gitignore
  echo .env >> .gitignore
  echo .env.test >> .gitignore
  echo >> .gitignore
  echo # parcel-bundler cache >> .gitignore
  echo .cache >> .gitignore
  echo .parcel-cache >> .gitignore
  echo >> .gitignore
  echo # next.js build output >> .gitignore
  echo .next >> .gitignore
  echo >> .gitignore
  echo # nuxt.js build output >> .gitignore
  echo .nuxt >> .gitignore
  echo >> .gitignore
  echo # vuepress build output >> .gitignore
  echo .vuepress/dist >> .gitignore
  echo >> .gitignore
  echo # Serverless directories >> .gitignore
  echo .serverless >> .gitignore
  echo >> .gitignore
  echo # FuseBox cache >> .gitignore
  echo .fusebox/ >> .gitignore
  echo >> .gitignore
  echo # DynamoDB Local files >> .gitignore
  echo .dynamodb/ >> .gitignore
  echo >> .gitignore
  echo # TernJS port file >> .gitignore
  echo .tern-port >> .gitignore
  echo >> .gitignore
  echo # Stores VSCode versions used for testing VSCode extensions >> .gitignore
  echo .vscode-test >> .gitignore
  echo >> .gitignore
  echo # Python >> .gitignore
  echo *.py[cod] >> .gitignore
  echo *$py.class >> .gitignore
  echo >> .gitignore
  echo # C extensions >> .gitignore
  echo *.so >> .gitignore
  echo >> .gitignore
  echo # Distribution / packaging >> .gitignore
  echo .Python >> .gitignore
  echo build/ >> .gitignore
  echo develop-eggs/ >> .gitignore
  echo dist/ >> .gitignore
  echo downloads/ >> .gitignore
  echo eggs/ >> .gitignore
  echo .eggs/ >> .gitignore
  echo lib/ >> .gitignore
  echo lib64/ >> .gitignore
  echo parts/ >> .gitignore
  echo sdist/ >> .gitignore
  echo var/ >> .gitignore
  echo wheels/ >> .gitignore
  echo *.egg-info/ >> .gitignore
  echo .installed.cfg >> .gitignore
  echo *.egg >> .gitignore
  echo MANIFEST >> .gitignore
  echo >> .gitignore
  echo # PyInstaller >> .gitignore
  echo *.manifest >> .gitignore
  echo *.spec >> .gitignore
  echo >> .gitignore
  echo # Installer logs >> .gitignore
  echo pip-log.txt >> .gitignore
  echo pip-delete-this-directory.txt >> .gitignore
  echo >> .gitignore
  echo # Unit test / coverage reports >> .gitignore
  echo htmlcov/ >> .gitignore
  echo .tox/ >> .gitignore
  echo .coverage >> .gitignore
  echo .coverage.* >> .gitignore
  echo .cache >> .gitignore
  echo nosetests.xml >> .gitignore
  echo coverage.xml >> .gitignore
  echo *.cover >> .gitignore
  echo .hypothesis/ >> .gitignore
  echo .pytest_cache/ >> .gitignore
  echo >> .gitignore
  echo # Translations >> .gitignore
  echo *.mo >> .gitignore
  echo *.pot >> .gitignore
  echo >> .gitignore
  echo # Django stuff: >> .gitignore
  echo *.log >> .gitignore
  echo local_settings.py >> .gitignore
  echo db.sqlite3 >> .gitignore
  echo >> .gitignore
  echo # Flask stuff: >> .gitignore
  echo instance/ >> .gitignore
  echo .webassets-cache >> .gitignore
  echo >> .gitignore
  echo # Scrapy stuff: >> .gitignore
  echo .scrapy >> .gitignore
  echo >> .gitignore
  echo # Sphinx documentation >> .gitignore
  echo docs/_build/ >> .gitignore
  echo >> .gitignore
  echo # PyBuilder >> .gitignore
  echo target/ >> .gitignore
  echo >> .gitignore
  echo # Jupyter Notebook >> .gitignore
  echo .ipynb_checkpoints >> .gitignore
  echo >> .gitignore
  echo # pyenv >> .gitignore
  echo .python-version >> .gitignore
  echo >> .gitignore
  echo # celery beat schedule file >> .gitignore
  echo celerybeat-schedule >> .gitignore
  echo >> .gitignore
  echo # SageMath parsed files >> .gitignore
  echo *.sage.py >> .gitignore
  echo >> .gitignore
  echo # Environments >> .gitignore
  echo .env >> .gitignore
  echo .venv >> .gitignore
  echo env/ >> .gitignore
  echo venv/ >> .gitignore
  echo ENV/ >> .gitignore
  echo env.bak/ >> .gitignore
  echo venv.bak/ >> .gitignore
  echo >> .gitignore
  echo # Spyder project settings >> .gitignore
  echo .spyderproject >> .gitignore
  echo .spyproject >> .gitignore
  echo >> .gitignore
  echo # Rope project settings >> .gitignore
  echo .ropeproject >> .gitignore
  echo >> .gitignore
  echo # mkdocs documentation >> .gitignore
  echo /site >> .gitignore
  echo >> .gitignore
  echo # mypy >> .gitignore
  echo .mypy_cache/ >> .gitignore
  echo .dmypy.json >> .gitignore
  echo dmypy.json >> .gitignore
  echo >> .gitignore
  echo # IDEs >> .gitignore
  echo .vscode/ >> .gitignore
  echo .idea/ >> .gitignore
  echo *.swp >> .gitignore
  echo *.swo >> .gitignore
  echo *~ >> .gitignore
  echo >> .gitignore
  echo # OS >> .gitignore
  echo .DS_Store >> .gitignore
  echo .DS_Store? >> .gitignore
  echo ._* >> .gitignore
  echo .Spotlight-V100 >> .gitignore
  echo .Trashes >> .gitignore
  echo ehthumbs.db >> .gitignore
  echo Thumbs.db >> .gitignore
  echo >> .gitignore
  echo # Docker >> .gitignore
  echo .docker/ >> .gitignore
  echo >> .gitignore
  echo # Alembic >> .gitignore
  echo alembic/versions/*.py >> .gitignore
  echo !alembic/versions/__init__.py >> .gitignore
  echo >> .gitignore
  echo # Archivos temporales >> .gitignore
  echo *.tmp >> .gitignore
  echo *.temp >> .gitignore
  echo >> .gitignore
  echo # Archivos de backup >> .gitignore
  echo *.bak >> .gitignore
  echo *.backup >> .gitignore
  echo >> .gitignore
  echo # Archivos de test >> .gitignore
  echo test_*.py >> .gitignore
  echo *_test.py >> .gitignore
  echo tests/ >> .gitignore
  echo >> .gitignore
  echo # Archivos de configuracion local >> .gitignore
  echo docker-compose.override.yml >> .gitignore
  echo >> .gitignore
  echo ¡Archivo .gitignore creado!
)

echo.
echo Agregando repositorio remoto de GitHub...
git remote add origin https://github.com/cortsfranco/OpenDoorsSO.git

echo.
echo Agregando todos los archivos al repositorio...
git add .

echo.
echo Haciendo el commit inicial...
git commit -m "Initial commit: Open Doors Management System with enhanced features"

echo.
echo ¿Deseas hacer push al repositorio remoto? (S/N)
set /p push_confirm="Respuesta: "

if /i "%push_confirm%" equ "S" (
  echo.
  echo Haciendo push al repositorio remoto...
  git push -u origin main
  
  if %errorlevel% equ 0 (
    echo.
    echo ¡Repositorio configurado exitosamente!
    echo Tu codigo esta ahora disponible en: https://github.com/cortsfranco/OpenDoorsSO.git
  ) else (
    echo.
    echo Error: No se pudo hacer push al repositorio.
    echo Verifica tu conexion a internet y tus credenciales de GitHub.
    echo.
    echo Puedes intentar hacer push manualmente con:
    echo   git push -u origin main
  )
) else (
  echo.
  echo Repositorio local configurado. Puedes hacer push mas tarde con:
  echo   git push -u origin main
)

echo.
echo Configuracion completada.
echo.
echo Comandos utiles:
echo   git status          - Ver estado del repositorio
echo   git add .           - Agregar todos los archivos
echo   git commit -m "msg" - Hacer commit
echo   git push            - Subir cambios
echo   git pull            - Descargar cambios
echo.
pause
