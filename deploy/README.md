# Deploy Simple para IMCYC en Debian

Deploy simple para cualquier máquina virtual Debian con Apache2 y MySQL ya instalados.

## 📋 Requisitos

- Debian/Ubuntu con Apache2 y MySQL instalados
- Acceso sudo
- Node.js y npm
- Usuario root de MySQL

## 🚀 Instalación

```bash
# 1. Ir al directorio del proyecto
cd /ruta/al/proyecto/imcyc

# 2. Instalar dependencias
npm install

# 3. Ejecutar deploy
chmod +x deploy/simple-deploy.sh
sudo ./deploy/simple-deploy.sh
```

## 📱 Acceso

- **URL**: `http://localhost/imcyc/`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 🧪 Verificar

```bash
# API
curl http://localhost/imcyc/api/evaluaciones/tipos

# Base de datos
mysql -u imcyc_user -p imcyc_evaluaciones
```

## 🔧 Estructura

```
/var/www/html/imcyc/
├── index.html          # Frontend
├── assets/             # CSS, JS
├── api/                # Backend PHP
└── .htaccess          # Configuración
```