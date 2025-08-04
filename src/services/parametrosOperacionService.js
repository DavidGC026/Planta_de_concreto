import { API_ENDPOINTS } from '@/utils/paths';

const API_URL = API_ENDPOINTS.EVALUACIONES.PARAMETROS_OPERACION;

const parametrosOperacionService = {
  // Obtener todos los datos de volumen
  async getDatosVolumen() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Error al obtener datos de volumen');
      }
    } catch (error) {
      console.error('Error en getDatosVolumen:', error);
      throw error;
    }
  },

  // Crear nuevo registro de volumen
  async crearDatoVolumen(datosVolumen) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosVolumen)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Error al crear dato de volumen');
      }
    } catch (error) {
      console.error('Error en crearDatoVolumen:', error);
      throw error;
    }
  },

  // Actualizar registro de volumen
  async actualizarDatoVolumen(id, datosVolumen) {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...datosVolumen })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Error al actualizar dato de volumen');
      }
    } catch (error) {
      console.error('Error en actualizarDatoVolumen:', error);
      throw error;
    }
  },

  // Eliminar registro de volumen
  async eliminarDatoVolumen(id) {
    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Error al eliminar dato de volumen');
      }
    } catch (error) {
      console.error('Error en eliminarDatoVolumen:', error);
      throw error;
    }
  }
};

export default parametrosOperacionService;
