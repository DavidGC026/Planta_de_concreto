# IMCYC - Evaluación Jefe de Planta

Sistema simplificado para la evaluación específica del rol de Jefe de Planta del Instituto Mexicano del Cemento y del Concreto A.C.

## 🏗️ Características

- **Evaluación específica** para Jefe de Planta
- **5 secciones** de evaluación con ponderación
- **Sistema de calificación** con 91% mínimo para aprobar
- **Interfaz moderna** con React y Tailwind CSS
- **API simplificada** en PHP

## 📋 Secciones de Evaluación

1. **Conocimiento técnico y operativo** (15%)
2. **Gestión de la producción** (20%)
3. **Seguridad y cumplimiento normativo** (25%)
4. **Gestión del personal** (20%)
5. **Mejora continua y resultados** (20%)

## 🚀 Instalación

### Requisitos
- Node.js 18+
- PHP 8.0+
- Servidor web (Apache/Nginx)

### Pasos

1. **Instalar dependencias**
```bash
cd Jefe_Planta
npm install
```

2. **Desarrollo**
```bash
npm run dev
```

3. **Construir para producción**
```bash
npm run build
```

4. **Configurar API**
- Editar `api/config/database.php` con tus credenciales de BD
- Copiar carpeta `api/` a tu servidor web
- Asegurar que mod_rewrite esté habilitado

## 🔐 Acceso

- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 📊 Sistema de Calificación

- **Verde (91-100%)**: Aprobado
- **Rojo (0-90%)**: Reprobado

## 🗂️ Estructura del Proyecto

```
Jefe_Planta/
├── src/
│   ├── components/
│   │   ├── LoginScreen.jsx
│   │   ├── JefePlantaEvaluation.jsx
│   │   ├── ResultsScreen.jsx
│   │   └── ui/
│   ├── services/
│   │   └── api.js
│   └── App.jsx
├── api/
│   ├── auth/
│   ├── evaluaciones/
│   └── config/
└── public/
```

## 🎯 Funcionalidades

- ✅ Inicio de sesión simplificado
- ✅ Evaluación por secciones con ponderación
- ✅ Cálculo automático de puntuación
- ✅ Resultados con gráfica circular
- ✅ Descarga de reportes en JSON
- ✅ Interfaz responsive
- ✅ Animaciones suaves

## 🔧 Personalización

Para modificar las preguntas, editar el archivo:
`api/evaluaciones/preguntas.php`

Para cambiar la configuración de base de datos:
`api/config/database.php`

## 📝 Licencia

© 2024 Instituto Mexicano del Cemento y del Concreto A.C.