# 📋 Scripts de Git para Open Doors Management System

Este conjunto de scripts te permite gestionar fácilmente el repositorio Git del proyecto Open Doors Management System.

## 🚀 Scripts Disponibles

### 1. `git-manager.bat` - **Script Principal**
**Uso:** Ejecuta este script para acceder a un menú interactivo con todas las opciones.

```bash
git-manager.bat
```

**Funcionalidades:**
- ✅ Verificar estado del repositorio
- ✅ Configurar repositorio Git (primera vez)
- ✅ Commit y push con mensaje personalizado
- ✅ Push rápido con mensaje estándar
- ✅ Crear backup completo del proyecto
- ✅ Ver logs y historial
- ✅ Sincronizar con repositorio remoto

### 2. `git-setup-repo.bat` - **Configuración Inicial**
**Uso:** Ejecuta solo la primera vez para configurar el repositorio Git.

```bash
git-setup-repo.bat
```

**Qué hace:**
- 🔧 Inicializa el repositorio Git
- 🔧 Configura usuario y email
- 🔧 Crea archivo `.gitignore` completo
- 🔧 Agrega repositorio remoto de GitHub
- 🔧 Hace el commit inicial
- 🔧 Opcionalmente hace push al repositorio

### 3. `git-commit-all.bat` - **Commit Personalizado**
**Uso:** Para hacer commit con un mensaje personalizado.

```bash
git-commit-all.bat
```

**Qué hace:**
- 📝 Muestra el estado actual del repositorio
- 📝 Te permite ingresar un mensaje personalizado
- 📝 Hace commit de todos los cambios
- 📝 Hace push al repositorio remoto

### 4. `git-quick-push.bat` - **Push Rápido**
**Uso:** Para hacer commit y push rápido con mensaje estándar.

```bash
git-quick-push.bat
```

**Qué hace:**
- ⚡ Agrega todos los archivos automáticamente
- ⚡ Usa un mensaje estándar con fecha y hora
- ⚡ Hace commit y push en un solo paso

### 5. `git-status-check.bat` - **Verificar Estado**
**Uso:** Para ver el estado actual del repositorio.

```bash
git-status-check.bat
```

**Qué hace:**
- 📊 Muestra el estado actual del repositorio
- 📊 Lista archivos modificados
- 📊 Muestra información del repositorio remoto
- 📊 Muestra los últimos commits
- 📊 Opción para hacer commit

### 6. `git-backup.bat` - **Crear Backup**
**Uso:** Para crear una copia de seguridad completa del proyecto.

```bash
git-backup.bat
```

**Qué hace:**
- 💾 Crea una copia completa del proyecto
- 💾 Excluye archivos innecesarios (.git, node_modules, etc.)
- 💾 Opcionalmente comprime el backup
- 💾 Crea archivo de información del backup

## 🎯 Flujo de Trabajo Recomendado

### **Primera vez (Configuración inicial):**
1. Ejecuta `git-setup-repo.bat`
2. Sigue las instrucciones en pantalla
3. ¡Listo! Tu repositorio está configurado

### **Uso diario:**
1. Ejecuta `git-manager.bat`
2. Selecciona la opción que necesites
3. Sigue las instrucciones en pantalla

### **Para cambios rápidos:**
```bash
git-quick-push.bat
```

### **Para cambios importantes:**
```bash
git-commit-all.bat
```

## 🔧 Configuración del Repositorio

El repositorio está configurado para usar:
- **URL:** `https://github.com/cortsfranco/OpenDoorsSO.git`
- **Usuario:** Franco Corts
- **Email:** cortsfranco@hotmail.com

## 📁 Archivos Excluidos del Git

El archivo `.gitignore` incluye:
- Archivos de configuración local (`.env`)
- Dependencias (`node_modules/`, `__pycache__/`)
- Logs y archivos temporales
- Archivos de IDE (`.vscode/`, `.idea/`)
- Archivos del sistema (`.DS_Store`, `Thumbs.db`)
- Archivos de backup y test

## 🆘 Solución de Problemas

### **Error: "No se detectó un repositorio Git"**
- Ejecuta `git-setup-repo.bat` para configurar el repositorio

### **Error: "No se pudo hacer push"**
- Verifica tu conexión a internet
- Verifica tus credenciales de GitHub
- Asegúrate de que el repositorio remoto existe

### **Error: "Archivo .env no encontrado"**
- Crea un archivo `.env` basado en `env.example`
- No subas el archivo `.env` al repositorio (está en `.gitignore`)

## 📚 Comandos Git Útiles

```bash
# Ver estado
git status

# Agregar archivos
git add .

# Hacer commit
git commit -m "Mensaje descriptivo"

# Hacer push
git push origin main

# Hacer pull
git pull origin main

# Ver historial
git log --oneline

# Ver cambios
git diff
```

## 🎉 ¡Listo!

Con estos scripts tienes todo lo necesario para gestionar tu repositorio Git de manera fácil y eficiente. 

**Recomendación:** Usa `git-manager.bat` como punto de entrada principal, ya que te da acceso a todas las funcionalidades desde un menú interactivo.

---

**Desarrollado para Open Doors Management System**  
*Sistema de gestión financiera con IA*
