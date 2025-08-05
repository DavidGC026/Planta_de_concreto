# Deployment - Sistema de Evaluación de Plantas de Concreto

## 🚀 Deploy Automático

Para realizar un deploy automático, ejecuta el script:

```bash
./deploy.sh
```

Este script realiza automáticamente:
- ✅ Backup del deploy anterior
- ✅ Instalación de dependencias
- ✅ Build de producción
- ✅ Copia de archivos al servidor
- ✅ Configuración de permisos
- ✅ Configuración de Apache
- ✅ Verificación del deployment

## 📁 Estructura de Deployment

```
/var/www/html/plantaconcreto/
├── index.html              # Aplicación principal
├── assets/                 # CSS, JS y otros assets
├── api/                   # Backend PHP
├── .htaccess              # Configuración de Apache
├── Concreton.png          # Recursos estáticos
├── Fondo.png              
├── Logo_imcyc.png         
└── evaluacion-personal.html
```

## 🔧 Deploy Manual

Si prefieres hacer el deploy manual:

### 1. Generar Build
```bash
npm install
npm run build
```

### 2. Copiar Archivos
```bash
sudo mkdir -p /var/www/html/plantaconcreto
sudo cp -r dist/* /var/www/html/plantaconcreto/
sudo cp -r api /var/www/html/plantaconcreto/
```

### 3. Configurar Permisos
```bash
sudo chown -R www-data:www-data /var/www/html/plantaconcreto
sudo chmod -R 755 /var/www/html/plantaconcreto
```

### 4. Configurar Apache

Crear archivo `/etc/apache2/sites-available/plantaconcreto.conf`:

```apache
<VirtualHost *:80>
    ServerName plantaconcreto.local
    DocumentRoot /var/www/html/plantaconcreto
    
    <Directory /var/www/html/plantaconcreto>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
    
    <Directory /var/www/html/plantaconcreto/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
        
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/plantaconcreto_error.log
    CustomLog ${APACHE_LOG_DIR}/plantaconcreto_access.log combined
</VirtualHost>
```

### 5. Habilitar Sitio
```bash
sudo a2enmod rewrite headers
sudo a2ensite plantaconcreto
sudo systemctl reload apache2
```

## 🌐 URLs de Acceso

- **Aplicación Principal**: http://localhost/plantaconcreto/
- **API**: http://localhost/plantaconcreto/api/
- **Logs de Error**: /var/log/apache2/plantaconcreto_error.log
- **Logs de Acceso**: /var/log/apache2/plantaconcreto_access.log

## 🔍 Verificación

Verifica que el deployment está funcionando:

```bash
# Verificar aplicación principal
curl -I http://localhost/plantaconcreto/

# Verificar API
curl -I http://localhost/plantaconcreto/api/

# Ver logs en tiempo real
sudo tail -f /var/log/apache2/plantaconcreto_error.log
```

## 📦 Backups

Los backups automáticos se guardan en:
```
/var/backups/plantaconcreto/backup-YYYYMMDD-HHMMSS/
```

## 🛠️ Troubleshooting

### API devuelve 404
- Verificar que los archivos PHP están en `/var/www/html/plantaconcreto/api/`
- Verificar permisos: `sudo chown -R www-data:www-data /var/www/html/plantaconcreto`

### Rutas de la SPA no funcionan
- Verificar que el archivo `.htaccess` existe y tiene las reglas de rewrite
- Verificar que `mod_rewrite` está habilitado: `sudo a2enmod rewrite`

### Errores CORS
- Verificar headers en Apache
- Verificar que `mod_headers` está habilitado: `sudo a2enmod headers`

### Error de permisos
```bash
sudo chown -R www-data:www-data /var/www/html/plantaconcreto
sudo chmod -R 755 /var/www/html/plantaconcreto
```

## 📋 Checklist de Deployment

- [ ] Build generado exitosamente
- [ ] Archivos copiados a `/var/www/html/plantaconcreto/`
- [ ] Permisos configurados correctamente  
- [ ] Apache configurado y recargado
- [ ] URL principal responde (200)
- [ ] API responde correctamente
- [ ] Funcionalidad de login funciona
- [ ] Rutas de navegación funcionan
- [ ] Assets se cargan correctamente

## 🚨 Rollback

En caso de problemas, hacer rollback al backup anterior:

```bash
# Listar backups disponibles
ls /var/backups/plantaconcreto/

# Restaurar backup (reemplazar con la fecha correcta)
sudo rm -rf /var/www/html/plantaconcreto
sudo cp -r /var/backups/plantaconcreto/backup-YYYYMMDD-HHMMSS/plantaconcreto /var/www/html/
sudo systemctl reload apache2
```
