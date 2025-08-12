/**
 * Servicio de API para comunicación con el backend
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

// Configuración base de la API - AJUSTAR SEGÚN TU SUBPÁGINA
const API_BASE_URL = (window.location.hostname === 'localhost' && window.location.port !== '')
  ? '/api' // Para desarrollo local (usa el proxy de Vite)
  : '/plantaconcreto/api'; // Ruta relativa para producción

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('imcyc_token');
  }

  /**
   * Realizar petición HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autorización si existe
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error en la respuesta del servidor');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Métodos de autenticación
   */
  async login(username, password) {
    try {
      const response = await this.request('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.success) {
        this.token = response.data.token;
        localStorage.setItem('imcyc_token', this.token);
        localStorage.setItem('imcyc_user', JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error('Error en el login');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Login SSO por email (token firmado opcional)
   * params: { email, ts?, signature? }
   */
  async ssoLogin({ email, ts, signature }) {
    try {
      const body = { email };
      if (ts) body.ts = ts;
      if (signature) body.signature = signature;
      const response = await this.request('auth/sso-login.php', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.success) {
        this.token = response.data.token;
        localStorage.setItem('imcyc_token', this.token);
        localStorage.setItem('imcyc_user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      throw new Error('Error en SSO');
    } catch (error) {
      console.error('SSO login error:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('imcyc_token');
    localStorage.removeItem('imcyc_user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('imcyc_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!this.token && !!this.getCurrentUser();
  }

  /**
   * Métodos de evaluaciones
   */
  async getTiposEvaluacion() {
    try {
      const response = await this.request('evaluaciones/tipos.php');
      return response.data || [];
    } catch (error) {
      console.error('Error getting evaluation types:', error);
      return [];
    }
  }

  async getRolesPersonal() {
    try {
      const response = await this.request('evaluaciones/roles.php');
      return response.data || [];
    } catch (error) {
      console.error('Error getting personnel roles:', error);
      return [];
    }
  }

  async getPreguntas(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Añadir parámetros básicos
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.rol) queryParams.append('rol', params.rol);

      // Añadir parámetros adicionales para evaluación de equipo
      if (params.tipoPlanta) queryParams.append('tipo_planta', params.tipoPlanta);
      if (params.categoria) queryParams.append('categoria', params.categoria);

      const response = await this.request(`evaluaciones/preguntas.php?${queryParams}`);
      return response.data || { secciones: [] };
    } catch (error) {
      console.error('Error getting questions:', error);
      return { secciones: [] };
    }
  }

  async guardarEvaluacion(evaluacionData) {
    try {
      const response = await this.request('evaluaciones/guardar.php', {
        method: 'POST',
        body: JSON.stringify(evaluacionData),
      });
      return response.data;
    } catch (error) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  /**
   * Método para guardar progreso de sección (compatible con ambos sistemas)
   */
  async guardarProgresoSeccion(progresoData) {
    try {
      // Determinar qué endpoint usar según el tipo de evaluación
      const endpoint = progresoData.tipo_evaluacion === 'equipo'
        ? 'evaluaciones/progreso-subseccion.php'
        : 'evaluaciones/progreso-seccion.php';

      // Mapear campos para compatibilidad
      const dataToSend = {
        ...progresoData,
        // Para evaluación de equipo, mapear seccion_* a subseccion_*
        ...(progresoData.tipo_evaluacion === 'equipo' && {
          subseccion_nombre: progresoData.seccion_nombre,
          subseccion_orden: progresoData.seccion_orden,
          puntaje_subseccion: progresoData.puntaje_seccion
        })
      };

      const response = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(dataToSend),
      });
      return response.data;
    } catch (error) {
      console.error('Error saving section progress:', error);
      throw error;
    }
  }

  /**
   * Método para obtener progreso de secciones (compatible con ambos sistemas)
   */
  async getProgresoSecciones(filtros = {}) {
    try {
      // Determinar qué endpoint usar según el tipo de evaluación
      const endpoint = filtros.tipo_evaluacion === 'equipo'
        ? 'evaluaciones/progreso-subsecciones.php'
        : 'evaluaciones/progreso-secciones.php';

      const params = new URLSearchParams();

      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await this.request(`${endpoint}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting section progress:', error);
      throw error;
    }
  }

  async getHistorialEvaluaciones(filtros = {}) {
    try {
      const params = new URLSearchParams();

      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await this.request(`evaluaciones/historial.php?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting evaluation history:', error);
      throw error;
    }
  }

  async getResultadosPersonal() {
    try {
      const response = await this.request('evaluaciones/resultados-personal.php');
      return response.data;
    } catch (error) {
      console.error('Error getting personal results:', error);
      throw error;
    }
  }

  /**
   * Métodos de reportes
   */
  async generarReporte(evaluacionId, tipoReporte = 'json') {
    try {
      const response = await this.request('reportes/generar.php', {
        method: 'POST',
        body: JSON.stringify({
          evaluacion_id: evaluacionId,
          tipo_reporte: tipoReporte,
        }),
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Gestión de tokens permanentes (Admin)
  async listarTokensPermanentes() {
    const res = await this.request('admin/manage-permanent-tokens.php');
    return res.data || [];
  }
  async crearTokenPermanente(pageSlug, tipoEvaluacion = null, expiresInDays = null, expiresAt = null, never = false) {
    const res = await this.request('admin/manage-permanent-tokens.php', {
      method: 'POST',
      body: JSON.stringify({ page_slug: pageSlug, tipo_evaluacion: tipoEvaluacion, expires_in_days: never ? null : expiresInDays, expires_at: never ? null : expiresAt }),
    });
    return res.data;
  }
  async desactivarTokenPermanente(token) {
    const res = await this.request(`admin/manage-permanent-tokens.php?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
    return res.data;
  }

  /**
   * Método para verificar conectividad
   */
  async checkConnection() {
    try {
      await this.request('evaluaciones/tipos.php');
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Métodos para gestión de estado de exámenes
   */
  async verificarAccesoExamen(userId) {
    try {
      const response = await this.request(`gestion_estado_examenes.php/verificar/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking exam access:', error);
      return { puede_realizar_examenes: true }; // Por defecto permitir
    }
  }

  async obtenerEstadoExamen(userId) {
    try {
      const response = await this.request(`gestion_estado_examenes.php/usuario/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting exam status:', error);
      return null;
    }
  }

  async bloquearExamen(userId, motivo, bloqueadoPorUserId) {
    try {
      const response = await this.request('gestion_estado_examenes.php/bloquear', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId,
          motivo: motivo,
          bloqueado_por_usuario_id: bloqueadoPorUserId
        })
      });
      return response;
    } catch (error) {
      console.error('Error blocking exam:', error);
      throw error;
    }
  }

  async desbloquearExamen(userId, motivo, desbloqueadoPorUserId) {
    try {
      const response = await this.request('gestion_estado_examenes.php/desbloquear', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId,
          motivo: motivo,
          desbloqueado_por_usuario_id: desbloqueadoPorUserId
        })
      });
      return response;
    } catch (error) {
      console.error('Error unblocking exam:', error);
      throw error;
    }
  }

  async obtenerHistorialEstadoExamenes(userId = null) {
    try {
      const endpoint = userId
        ? `gestion_estado_examenes.php/historial/${userId}`
        : 'gestion_estado_examenes.php/historial';
      const response = await this.request(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error getting exam history:', error);
      return [];
    }
  }

  async obtenerTodosLosEstadosExamenes() {
    try {
      const response = await this.request('gestion_estado_examenes.php/usuarios');
      return response.data;
    } catch (error) {
      console.error('Error getting all exam statuses:', error);
      return [];
    }
  }

  // Permisos en BD de Resultados (externa)
  async listarResultadosUsuarios() {
    const res = await this.request('admin/manage-resultados-permisos.php');
    return res.data || [];
  }
  async actualizarResultadosPermiso(usuarioId, permiso) {
    const res = await this.request('admin/manage-resultados-permisos.php', {
      method: 'PATCH',
      body: JSON.stringify({ usuario_id: usuarioId, permiso: permiso ? 1 : 0 })
    });
    return res.data;
  }
}

// Crear instancia singleton
const apiService = new ApiService();

export default apiService;

// Exportar también métodos específicos para facilitar el uso
export const {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getTiposEvaluacion,
  getRolesPersonal,
  getPreguntas,
  guardarEvaluacion,
  guardarProgresoSeccion,
  getProgresoSecciones,
  getHistorialEvaluaciones,
  generarReporte,
  checkConnection,
} = apiService;
