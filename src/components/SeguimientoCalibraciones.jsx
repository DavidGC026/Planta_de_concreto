import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import seguimientoCalibracionesService from '@/services/seguimientoCalibracionesService';
import { toast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

const initialRows = [
  { parametro: "", frecuencia: "", observaciones: "", referencia: "" }
];

const SeguimientoCalibraciones = () => {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(true);

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
  };

  const saveRow = async (row) => {
    try {
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
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando calibraciones...</div>;
  }

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
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Parámetro</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Frecuencia Sugerida</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Observaciones</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Referencia Normativa o Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-2">
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
                        <input
                          className="w-full border rounded px-2 py-1 text-gray-800"
                          value={row.referencia}
                          onChange={e => handleChange(idx, "referencia", e.target.value)}
                          onBlur={() => saveRow(row)}
                          placeholder="Norma, Manual, etc."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={addRow} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Agregar fila</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeguimientoCalibraciones;
