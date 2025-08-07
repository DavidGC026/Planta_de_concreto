import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, Calendar, User, BarChart3, ArrowLeft } from 'lucide-react';
import apiService from '@/services/api';

const ExamBlockedScreen = ({ currentUser, onBack }) => {
  const [examStatus, setExamStatus] = useState(null);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamStatus();
  }, []);

  const loadExamStatus = async () => {
    try {
      setLoading(true);
      
      // Obtener estado del examen
      const status = await apiService.obtenerEstadoExamen(currentUser.id);
      setExamStatus(status);
      
      // Obtener última evaluación para mostrar calificación
      const evaluations = await apiService.getHistorialEvaluaciones({
        usuario_id: currentUser.id,
        limit: 1
      });
      
      if (evaluations && evaluations.length > 0) {
        setLastEvaluation(evaluations[0]);
      }
    } catch (error) {
      console.error('Error loading exam status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verificando estado del examen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              No Puedes Realizar Más Evaluaciones
            </h1>
            <p className="text-gray-600">
              Tu acceso para realizar nuevas evaluaciones ha sido restringido
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado del bloqueo */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <Lock className="w-5 h-5 mr-2" />
                Estado del Examen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Bloqueado</span>
                  </Badge>
                </div>

                {examStatus?.motivo_bloqueo && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Motivo:</span>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <p className="text-sm text-red-800">{examStatus.motivo_bloqueo}</p>
                    </div>
                  </div>
                )}

                {examStatus?.fecha_bloqueo && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Fecha de bloqueo:</span>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(examStatus.fecha_bloqueo)}
                    </div>
                  </div>
                )}

                {examStatus?.bloqueado_por_nombre && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Bloqueado por:</span>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {examStatus.bloqueado_por_nombre}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Última calificación */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <BarChart3 className="w-5 h-5 mr-2" />
                Última Evaluación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastEvaluation ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {Math.round(lastEvaluation.puntuacion_ponderada || 0)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Calificación obtenida
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">
                        {lastEvaluation.puntuacion_total || 0}
                      </div>
                      <div className="text-gray-600">Puntos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">
                        {lastEvaluation.total_preguntas || 0}
                      </div>
                      <div className="text-gray-600">Preguntas</div>
                    </div>
                  </div>

                  {lastEvaluation.fecha_finalizacion && (
                    <div className="pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(lastEvaluation.fecha_finalizacion)}
                      </div>
                    </div>
                  )}

                  {lastEvaluation.observaciones && (
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-600">
                        {lastEvaluation.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay evaluaciones registradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ¿Qué significa que mi examen esté bloqueado?
                </h4>
                <p className="text-sm text-yellow-700">
                  Tu acceso para realizar nuevas evaluaciones ha sido temporalmente restringido. 
                  Esto puede deberse a diversos motivos relacionados con el rendimiento o cumplimiento 
                  de normas de seguridad.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  ¿Cómo puedo recuperar el acceso?
                </h4>
                <p className="text-sm text-blue-700">
                  Para recuperar el acceso a las evaluaciones, contacta con tu jefe de planta o 
                  con el administrador del sistema. Ellos podrán revisar tu situación y desbloquear 
                  tu acceso cuando corresponda.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  Mientras tanto...
                </h4>
                <p className="text-sm text-green-700">
                  Puedes aprovechar este tiempo para repasar los materiales de estudio, 
                  participar en capacitaciones adicionales o consultar con tus superiores 
                  sobre las áreas que necesites mejorar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamBlockedScreen;
