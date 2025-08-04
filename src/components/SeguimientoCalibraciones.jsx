<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState, useEffect } from "react";
import { IMAGES } from '@/utils/paths';
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import seguimientoCalibracionesService from '@/services/seguimientoCalibracionesService';
import { toast } from '@/components/ui/use-toast';
<<<<<<< HEAD
import { useEffect } from 'react';

const initialRows = [
  { parametro: "", frecuencia: "", observaciones: "", referencia: "" }
];
=======
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Los datos iniciales ahora vienen de la base de datos
const initialRows = [];
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb

const SeguimientoCalibraciones = () => {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD

  useEffect(() => {
    seguimientoCalibracionesService.getAll()
      .then(data => {
        if (data.length > 0) {
          setRows(data.map(row => ({
            id: row.id,
            parametro: row.parametro,
            frecuencia: row.frecuencia_sugerida,
            observaciones: row.observaciones,
            referencia: row.referencia_normativa
          })));
        }
        setLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudieron cargar las calibraciones', variant: 'destructive' });
        setLoading(false);
      });
  }, []);

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    newRows[index].changed = true;  // Marcar como cambiado
    setRows(newRows);
=======
  const [currentSection, setCurrentSection] = useState(0);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Cargar secciones desde la base de datos
    const loadData = async () => {
      try {
        const secciones = await seguimientoCalibracionesService.getSecciones();
        setSections(secciones);
        
        // Cargar parámetros de la primera sección
        if (secciones.length > 0) {
          await loadParametersForSection(secciones[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const loadParametersForSection = async (seccionId) => {
    try {
      const parametros = await seguimientoCalibracionesService.getParametrosBySeccion(seccionId);
      setRows(parametros.map(param => ({
        id: param.id,
        parametro: param.parametro,
        frecuencia: param.frecuencia_sugerida,
        lectura: param.lectura || null,
        observaciones: param.observaciones || "",
        referencia: param.referencia_normativa
      })));
    } catch (error) {
      console.error('Error cargando parámetros:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los parámetros de la sección', variant: 'destructive' });
    }
  };

  const handleChange = (index, field, value) => {
    // Solo permitir cambios en el campo de observaciones
    if (field === "observaciones") {
      const newRows = [...rows];
      newRows[index][field] = value;
      newRows[index].changed = true;
      setRows(newRows);
    }
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
  };

  const saveRow = async (row) => {
    try {
<<<<<<< HEAD
      if (row.changed) {  // Verificar solo si el row cambió
        const result = await seguimientoCalibracionesService.save({
          id: row.id || null,
          parametro: row.parametro,
          frecuencia_sugerida: row.frecuencia,
          observaciones: row.observaciones,
          referencia: row.referencia
        });
        row.id = result.id;
        row.changed = false;  // Resetear el marcador de cambio
        toast({ title: 'Guardado', description: `Calibración ${result.action === 'created' ? 'creada' : 'actualizada'} correctamente`, variant: 'success' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la calibración', variant: 'destructive' });
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      { parametro: "", frecuencia: "", observaciones: "", referencia: "" }
    ]);
=======
      if (row.changed && row.id) {
        await seguimientoCalibracionesService.updateObservaciones(row.id, row.observaciones);
        row.changed = false;
        toast({ title: 'Guardado', description: 'Observaciones actualizadas correctamente', variant: 'success' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron guardar las observaciones', variant: 'destructive' });
    }
  };

  // Removed addRow function as parameters are now managed from database

  const navigateSections = async (direction) => {
    const newIndex = currentSection + direction;
    if (newIndex >= 0 && newIndex < sections.length) {
      setCurrentSection(newIndex);
      await loadParametersForSection(sections[newIndex].id);
    }
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando calibraciones...</div>;
  }

<<<<<<< HEAD
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('public/Fondo.png')` }} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Calibraciones y Verificaciones</CardTitle>
            <p className="text-gray-600">Registra los parámetros, frecuencias, observaciones y referencias normativas o técnicas.</p>
          </CardHeader>
=======
  const currentSectionData = sections[currentSection] || { nombre: "Sección sin nombre", descripcion: "" };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${IMAGES.FONDO}')` }} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  {currentSectionData.nombre}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {currentSectionData.descripcion}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Sección {currentSection + 1} de {sections.length}
              </div>
            </div>
            
            {/* Navegación entre secciones */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <Button 
                onClick={() => navigateSections(-1)} 
                disabled={currentSection === 0} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Solo se pueden modificar las observaciones
                </p>
              </div>
              
              <Button 
                onClick={() => navigateSections(1)} 
                disabled={currentSection === sections.length - 1}
                variant="outline"
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Parámetro</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Frecuencia Sugerida</th>
<<<<<<< HEAD
=======
                    {currentSectionData.mostrar_lectura == 1 && (
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Lectura</th>
                    )}
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Observaciones</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Referencia Normativa o Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-2">
<<<<<<< HEAD
                        <input
                          className="w-full border rounded px-2 py-1 text-gray-800"
                          value={row.parametro}
                          onChange={e => handleChange(idx, "parametro", e.target.value)}
                          onBlur={() => saveRow(row)}
                          placeholder="Ej. Balanza, Sensor, etc."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full border rounded px-2 py-1 text-gray-800"
                          value={row.frecuencia}
                          onChange={e => handleChange(idx, "frecuencia", e.target.value)}
                          onBlur={() => saveRow(row)}
                          placeholder="Ej. Mensual, Anual, etc."
                        />
                      </td>
=======
                        <span className="text-gray-800">{row.parametro || "N/A"}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800">{row.frecuencia || "N/A"}</span>
                      </td>
                      {currentSectionData.mostrar_lectura == 1 ? (
                        <td className="px-4 py-2">
                          <span className="text-gray-800">{row.lectura || "--"}</span>
                        </td>
                      ) : null}
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
                      <td className="px-4 py-2">
                        <input
                          className="w-full border rounded px-2 py-1 text-gray-800"
                          value={row.observaciones}
                          onChange={e => handleChange(idx, "observaciones", e.target.value)}
                          onBlur={() => saveRow(row)}
                          placeholder="Observaciones"
                        />
                      </td>
                      <td className="px-4 py-2">
<<<<<<< HEAD
                        <input
                          className="w-full border rounded px-2 py-1 text-gray-800"
                          value={row.referencia}
                          onChange={e => handleChange(idx, "referencia", e.target.value)}
                          onBlur={() => saveRow(row)}
                          placeholder="Norma, Manual, etc."
                        />
=======
                        <span className="text-gray-800">{row.referencia || "N/A"}</span>
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
<<<<<<< HEAD
            <div className="flex justify-end mt-4">
              <Button onClick={addRow} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Agregar fila</Button>
            </div>
=======
            {/* Removed add row button - parameters are managed from database */}
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeguimientoCalibraciones;
