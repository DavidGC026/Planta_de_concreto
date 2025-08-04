/**
 * Configuración de rutas para la aplicación
 * Maneja las rutas base para desarrollo y producción
 */

// Obtener la base URL desde la configuración de Vite
const BASE_URL = import.meta.env.BASE_URL || '/';

/**
 * Obtener la ruta completa para un asset público
 * @param {string} path - Ruta relativa del asset
 * @returns {string} - Ruta completa del asset
 */
export const getAssetPath = (path) => {
  // Remover slash inicial si existe para evitar doble slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Obtener la ruta completa para una API
 * @param {string} endpoint - Endpoint de la API
 * @returns {string} - Ruta completa de la API
 */
export const getApiPath = (endpoint) => {
  // Remover slash inicial si existe para evitar doble slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${BASE_URL}api/${cleanEndpoint}`;
};

/**
 * Rutas de imágenes comunes
 */
export const IMAGES = {
  CONCRETON: getAssetPath('Concreton.png'),
  FONDO: getAssetPath('Fondo.png'),
  LOGO_IMCYC: getAssetPath('Logo_imcyc.png')
};

/**
 * Rutas de API comunes
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: getApiPath('auth/login.php'),
    CHECK_PERMISSIONS: getApiPath('auth/check-permissions.php')
  },
  EVALUACIONES: {
    TIPOS: getApiPath('evaluaciones/tipos.php'),
    ROLES: getApiPath('evaluaciones/roles.php'),
    PREGUNTAS: getApiPath('evaluaciones/preguntas.php'),
    GUARDAR: getApiPath('evaluaciones/guardar.php'),
    HISTORIAL: getApiPath('evaluaciones/historial.php'),
    RESULTADOS_PERSONAL: getApiPath('evaluaciones/resultados-personal.php'),
    PROGRESO_SECCION: getApiPath('evaluaciones/progreso-seccion.php'),
    PROGRESO_SECCIONES: getApiPath('evaluaciones/progreso-secciones.php'),
    PROGRESO_SUBSECCION: getApiPath('evaluaciones/progreso-subseccion.php'),
    PROGRESO_SUBSECCIONES: getApiPath('evaluaciones/progreso-subsecciones.php'),
    PROGRESO_EQUIPO: getApiPath('evaluaciones/progreso-equipo.php'),
    ROLES_PERMITIDOS: getApiPath('evaluaciones/roles-permitidos.php'),
    PARAMETROS_OPERACION: getApiPath('evaluaciones/parametros_operacion.php'),
    SEGUIMIENTO_CALIBRACIONES: getApiPath('evaluaciones/seguimiento_calibraciones.php'),
    SECCIONES_OPERACION: getApiPath('evaluaciones/secciones_operacion.php')
  },
  REPORTES: {
    GENERAR: getApiPath('reportes/generar.php')
  },
  GESTION: {
    ESTADO_EXAMENES: getApiPath('gestion_estado_examenes.php')
  },
  ADMIN: {
    MANAGE_PERMISSIONS: getApiPath('admin/manage-permissions.php')
  }
};

export default {
  getAssetPath,
  getApiPath,
  IMAGES,
  API_ENDPOINTS,
  BASE_URL
};
