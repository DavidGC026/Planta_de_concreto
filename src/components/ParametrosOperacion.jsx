import React, { useState, useEffect } from "react";
import { IMAGES } from '@/utils/paths';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import parametrosOperacionService from '@/services/parametrosOperacionService';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';

const ParametrosOperacion = ({ onBack }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    volumen: '',
    minimo: '80',
    maximo: '120',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const datos = await parametrosOperacionService.getDatosVolumen();
      setDatos(datos);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos de volumen', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.volumen || !formData.minimo || !formData.maximo) {
      toast({ title: 'Error', description: 'Todos los campos numéricos son requeridos', variant: 'destructive' });
      return;
    }

    try {
      if (editingId) {
        await parametrosOperacionService.actualizarDatoVolumen(editingId, formData);
        toast({ title: 'Éxito', description: 'Registro actualizado correctamente' });
      } else {
        await parametrosOperacionService.crearDatoVolumen(formData);
        toast({ title: 'Éxito', description: 'Registro creado correctamente' });
      }
      
      await cargarDatos();
      resetForm();
    } catch (error) {
      console.error('Error guardando datos:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el registro', variant: 'destructive' });
    }
  };

  const handleEdit = (registro) => {
    setFormData({
      fecha: registro.fecha,
      volumen: registro.volumen.toString(),
      minimo: registro.minimo.toString(),
      maximo: registro.maximo.toString(),
      observaciones: registro.observaciones || ''
    });
    setEditingId(registro.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      return;
    }

    try {
      await parametrosOperacionService.eliminarDatoVolumen(id);
      toast({ title: 'Éxito', description: 'Registro eliminado correctamente' });
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      volumen: '',
      minimo: '80',
      maximo: '120',
      observaciones: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando parámetros de operación...</div>;
  }

  // Formatear datos para la gráfica
  const datosGrafica = datos.map(item => ({
    ...item,
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    volumen: parseFloat(item.volumen),
    minimo: parseFloat(item.minimo),
    maximo: parseFloat(item.maximo)
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${IMAGES.FONDO}')` }} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {onBack && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Regresar
                  </Button>
                )}
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Parámetros de Operación
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Control de volumen de producción diaria
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Agregar Registro
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Gráfica */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Gráfica de Volumen vs Tiempo</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      label={{ value: 'm³', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="volumen" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Volumen"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="minimo" 
                      stroke="#dc2626" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Mínimo"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maximo" 
                      stroke="#16a34a" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Máximo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de datos */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Volumen (m³)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Mínimo</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Máximo</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Observaciones</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((registro) => (
                    <tr key={registro.id || registro.fecha} className="border-t border-gray-200">
                      <td className="px-4 py-2">
                        <span className="text-gray-800">
                          {new Date(registro.fecha).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800">{registro.volumen}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800">{registro.minimo}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800">{registro.maximo}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800">{registro.observaciones || '--'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(registro)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(registro.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal/Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={formData.fecha}
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volumen (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded px-3 py-2"
                      value={formData.volumen}
                      onChange={(e) => setFormData({...formData, volumen: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mínimo
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border rounded px-3 py-2"
                        value={formData.minimo}
                        onChange={(e) => setFormData({...formData, minimo: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border rounded px-3 py-2"
                        value={formData.maximo}
                        onChange={(e) => setFormData({...formData, maximo: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      rows="3"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      placeholder="Observaciones opcionales..."
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametrosOperacion;
