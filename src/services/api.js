/**
 * Servicio de API para comunicación con el backend
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

// Configuración base de la API
const API_BASE_URL = 'http://localhost/imcyc-api'; // Cambiar por URL de producción

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
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
    const response = await this.request('login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('imcyc_token', this.token);
      localStorage.setItem('imcyc_user', JSON.stringify(response.data.user));
    }

    return response;
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

  /**
   * Métodos de evaluaciones
   */
  async getTiposEvaluacion() {
    return this.request('evaluaciones/tipos');
  }

  async getRolesPersonal() {
    return this.request('evaluaciones/roles');
  }

  async getPreguntas(tipoEvaluacion, rolPersonal = null) {
    const params = new URLSearchParams({ tipo: tipoEvaluacion });
    if (rolPersonal) {
      params.append('rol', rolPersonal);
    }
    
    return this.request(`evaluaciones/preguntas?${params}`);
  }

  async guardarEvaluacion(evaluacionData) {
    return this.request('evaluaciones/guardar', {
      method: 'POST',
      body: JSON.stringify(evaluacionData),
    });
  }

  async getHistorialEvaluaciones(filtros = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined) {
        params.append(key, filtros[key]);
      }
    });

    return this.request(`evaluaciones/historial?${params}`);
  }

  /**
   * Métodos de reportes
   */
  async generarReporte(evaluacionId, tipoReporte = 'json') {
    return this.request('reportes/generar', {
      method: 'POST',
      body: JSON.stringify({
        evaluacion_id: evaluacionId,
        tipo_reporte: tipoReporte,
      }),
    });
  }

  /**
   * Método para verificar conectividad
   */
  async checkConnection() {
    try {
      await this.request('evaluaciones/tipos');
      return true;
    } catch (error) {
      return false;
    }
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
  getTiposEvaluacion,
  getRolesPersonal,
  getPreguntas,
  guardarEvaluacion,
  getHistorialEvaluaciones,
  generarReporte,
  checkConnection,
} = apiService;