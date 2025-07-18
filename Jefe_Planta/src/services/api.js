/**
 * Servicio de API simplificado para Jefe de Planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

// Configuración base de la API
const API_BASE_URL = '/api'; // Ajustar según tu configuración

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('jefe_planta_token');
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
   * Login
   */
  async login(username, password) {
    try {
      const response = await this.request('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.success) {
        this.token = response.data.token;
        localStorage.setItem('jefe_planta_token', this.token);
        localStorage.setItem('jefe_planta_user', JSON.stringify(response.data.user));
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
    localStorage.removeItem('jefe_planta_token');
    localStorage.removeItem('jefe_planta_user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('jefe_planta_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Obtener preguntas para Jefe de Planta
   */
  async getPreguntas(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.rol) queryParams.append('rol', params.rol);
      
      const response = await this.request(`evaluaciones/preguntas.php?${queryParams}`);
      return response.data || { secciones: [] };
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  }

  /**
   * Guardar evaluación
   */
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
}

// Crear instancia singleton
const apiService = new ApiService();

export default apiService;