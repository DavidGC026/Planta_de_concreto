# Deploy para Base de Datos Existente - IMCYC

Deploy simplificado para usar con una base de datos MySQL existente llamada `plantas_concreto`.

## 📋 Requisitos

- Debian/Ubuntu con Apache2 y MySQL instalados
- Base de datos MySQL existente llamada `plantas_concreto`
- Usuario MySQL con permisos sobre la base de datos
- Node.js y npm (para construir el frontend)

## 🚀 Instalación

```bash
# 1. Ir al directorio del proyecto
cd /ruta/al/proyecto/imcyc

# 2. Instalar dependencias (si es necesario)
npm install

# 3. Ejecutar deploy para base de datos existente
chmod +x deploy/simple-deploy-existing-db.sh
sudo ./deploy/simple-deploy-existing-db.sh
```

## 📊 Información Solicitada

El script te pedirá:
- **Usuario de MySQL existente**: El usuario que tiene acceso a la base de datos
- **Contraseña del usuario**: La contraseña del usuario MySQL

**Nota**: La base de datos debe llamarse exactamente `plantas_concreto`

## 📱 Acceso

- **URL**: `http://localhost/imcyc/`
- **Usuario**: Según esté configurado en tu base de datos
- **Contraseña**: Según esté configurado en tu base de datos

## 🔧 Estructura

```
/var/www/html/imcyc/
├── index.html          # Frontend React
├── assets/             # CSS, JS, imágenes
├── api/                # Backend PHP
│   ├── config/
│   │   └── database.php    # Configuración de BD (actualizada automáticamente)
│   ├── auth/
│   ├── evaluaciones/
│   └── reportes/
└── .htaccess          # Configuración Apache
```

## 🧪 Verificación

```bash
# Verificar API
curl http://localhost/imcyc/api/evaluaciones/tipos

# Verificar base de datos
mysql -u tu_usuario -p plantas_concreto
```

## 🔧 Solución de Problemas

### Error de conexión a BD
- Verifica que la base de datos `plantas_concreto` existe
- Verifica que el usuario tiene permisos sobre la base de datos
- Verifica las credenciales

### Error 500 en la API
```bash
# Verificar logs de Apache
sudo tail -f /var/log/apache2/error.log

# Verificar permisos
sudo chown -R www-data:www-data /var/www/html/imcyc
```

### Frontend no carga
```bash
# Verificar que mod_rewrite esté habilitado
sudo a2enmod rewrite
sudo systemctl reload apache2
```

## 📝 Notas Importantes

- **Base de datos fija**: El sistema está configurado para usar `plantas_concreto`
- **No crea usuarios**: Usa credenciales existentes
- **No modifica BD**: Solo se conecta a la base de datos existente
- **Permisos**: Los archivos pertenecen a `www-data` para Apache

## 🔄 Actualizar la Aplicación

Para actualizar solo el código:
```bash
# Hacer cambios en el código
# Ejecutar nuevamente el deploy
sudo ./deploy/simple-deploy-existing-db.sh
```

El script sobrescribirá los archivos pero mantendrá la configuración de la base de datos.