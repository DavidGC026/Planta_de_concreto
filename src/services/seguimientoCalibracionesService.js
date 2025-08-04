<<<<<<< HEAD
const API_URL = '/imcyc/api/evaluaciones/seguimiento_calibraciones.php';

const seguimientoCalibracionesService = {
  async getAll() {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener calibraciones');
    return data.data;
  },
  async save(calibracion) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calibracion)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al guardar calibración');
    return { id: data.id, action: data.action };
  }
};

export default seguimientoCalibracionesService;
=======
import { API_ENDPOINTS } from '@/utils/paths';

const API_URL = API_ENDPOINTS.EVALUACIONES.SEGUIMIENTO_CALIBRACIONES;

const seguimientoCalibracionesService = {
  async getSecciones() {
    const res = await fetch(API_ENDPOINTS.EVALUACIONES.SECCIONES_OPERACION);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener secciones');
    return data.data;
  },
  async getParametrosBySeccion(seccionId) {
    const res = await fetch(`${API_URL}?seccion_id=${seccionId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener parámetros');
    return data.data;
  },
  async getAllParametros() {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al obtener todos los parámetros');
    return data.data;
  },
  async updateObservaciones(parametroId, observaciones) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parametroId, observaciones })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al actualizar observaciones');
    return { id: data.id, action: data.action };
  }
};

export default seguimientoCalibracionesService;
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
