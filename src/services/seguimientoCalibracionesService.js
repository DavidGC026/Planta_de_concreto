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
