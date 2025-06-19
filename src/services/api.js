/**
 * Servicio de API para comunicación con el backend
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

// Configuración base de la API - AJUSTAR SEGÚN TU SUBPÁGINA
const API_BASE_URL = '/imcyc/api'; // Cambia 'imcyc' por el nombre de tu carpeta

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
      return response.data;
    } catch (error) {
      console.error('Error getting evaluation types:', error);
      throw error;
    }
  }

  async getRolesPersonal() {
    try {
      const response = await this.request('evaluaciones/roles.php');
      return response.data;
    } catch (error) {
      console.error('Error getting personnel roles:', error);
      throw error;
    }
  }

  async getPreguntas(tipoEvaluacion, rolPersonal = null) {
    try {
      const params = new URLSearchParams({ tipo: tipoEvaluacion });
      if (rolPersonal) {
        params.append('rol', rolPersonal);
      }
      
      const response = await this.request(`evaluaciones/preguntas.php?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
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
  getHistorialEvaluaciones,
  generarReporte,
  checkConnection,
} = apiService;