import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

// Evaluación de estado de planta (Operación)
const plantStatusEvaluation = {
  title: 'Evaluación del Estado de la Planta',
  icon: ClipboardCheck,
  sections: [
    {
      title: 'Estado de Equipos Principales',
      items: [
        { name: 'Mezcladora principal', status: null },
        { name: 'Básculas de cemento', status: null },
        { name: 'Básculas de agregados', status: null },
        { name: 'Sistema de agua', status: null },
        { name: 'Bandas transportadoras', status: null },
        { name: 'Silos de cemento', status: null },
        { name: 'Compresor de aire', status: null },
        { name: 'Sistema eléctrico', status: null },
        { name: 'Tolvas de agregados', status: null },
        { name: 'Sistema de control', status: null }
      ]
    },
    {
      title: 'Infraestructura y Seguridad',
      items: [
        { name: 'Señalización de seguridad', status: null },
        { name: 'Extintores', status: null },
        { name: 'Botiquín de primeros auxilios', status: null },
        { name: 'Iluminación general', status: null },
        { name: 'Drenajes y desagües', status: null },
        { name: 'Accesos y vialidades', status: null },
        { name: 'Área de laboratorio', status: null },
        { name: 'Oficinas administrativas', status: null },
        { name: 'Almacén de materiales', status: null },
        { name: 'Cerca perimetral', status: null }
      ]
    },
    {
      title: 'Documentación y Certificaciones',
      items: [
        { name: 'Licencias de operación', status: null },
        { name: 'Certificados de calidad', status: null },
        { name: 'Manuales de operación', status: null },
        { name: 'Registros de mantenimiento', status: null },
        { name: 'Bitácoras de producción', status: null },
        { name: 'Certificados de calibración', status: null },
        { name: 'Pólizas de seguro', status: null },
        { name: 'Permisos ambientales', status: null },
        { name: 'Capacitación del personal', status: null },
        { name: 'Procedimientos de emergencia', status: null }
      ]
    }
  ]
};

const EvaluationScreenOperacion = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [plantStatusAnswers, setPlantStatusAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(plantStatusEvaluation);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    // Para operación, los datos están predefinidos
    setEvaluationData(plantStatusEvaluation);
  }, []);

  // Scroll al inicio cuando cambia la sección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentSection]);

  const totalSections = evaluationData.sections.length;
  const currentSectionData = evaluationData.sections[currentSection];

  const progress = totalSections > 0 
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handlePlantStatusAnswer = (itemIndex, status) => {
    const key = `${currentSection}-${itemIndex}`;
    setPlantStatusAnswers(prev => ({ ...prev, [key]: status }));
  };

  const saveCurrentSectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular progreso de la sección actual
      const sectionAnswers = Object.entries(plantStatusAnswers)
        .filter(([key]) => key.startsWith(`${currentSection}-`));
      
      let sectionScore = 0;
      let correctAnswers = 0;
      const totalQuestions = sectionAnswers.length;
      
      sectionAnswers.forEach(([, status]) => {
        if (status === 'bueno') {
          sectionScore += 10;
          correctAnswers++;
        } else if (status === 'regular') {
          sectionScore += 5;
        }
      });

      const sectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de sección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'operacion',
        seccion_nombre: currentSectionData?.title || `Sección ${currentSection + 1}`,
        seccion_orden: currentSection + 1,
        puntaje_seccion: sectionScore,
        puntaje_porcentaje: sectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions
      });

    } catch (error) {
      console.error('Error saving section progress:', error);
    }
  };

  const handleNextSection = async () => {
    // Guardar progreso de la sección actual
    await saveCurrentSectionProgress();

    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      // Completar evaluación
      await completeEvaluation();
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);

      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular puntuación para evaluación de estado de planta
      const totalItems = Object.keys(plantStatusAnswers).length;
      let score = 0;
      
      Object.values(plantStatusAnswers).forEach(status => {
        if (status === 'bueno') score += 10;
        else if (status === 'regular') score += 5;
        // 'malo' = 0 puntos
      });

      // Preparar datos para guardar - evaluación de operación
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'operacion',
        rol_personal: null,
        respuestas: Object.entries(plantStatusAnswers).map(([key, status]) => {
          return {
            pregunta_id: null, // Para evaluación de operación no hay pregunta_id real
            respuesta: status === 'bueno' ? 'si' : status === 'regular' ? 'na' : 'no',
            observacion: `Item: ${key} - Estado: ${status}`
          };
        }),
        observaciones: 'Evaluación de estado de planta completada'
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers: plantStatusAnswers,
        score: Math.round(result.puntuacion_ponderada || score),
        totalAnswers: totalItems,
        evaluationTitle: evaluationData.title,
        sections: evaluationData.sections,
        isPlantStatus: true
      });

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido guardados exitosamente"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la evaluación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si todos los items de la sección actual han sido respondidos
  const allQuestionsAnswered = currentSectionData?.items?.every((_, index) => {
    const key = `${currentSection}-${index}`;
    return plantStatusAnswers[key] !== undefined;
  });

  // Pantalla de evaluación
  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("public/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8" ref={evaluationContentRef}>
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección */}
        {currentSection === 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={onSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Saltar a Resultados (Dev)</span>
            </Button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {evaluationData.title}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: totalSections }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < currentSection ? 'bg-blue-600' :
                    i === currentSection ? 'bg-blue-400' : 'bg-gray-300'} 
                    ${i < totalSections - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Panel principal de evaluación */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                {/* Header de la sección */}
                <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 text-center">
                    {currentSectionData?.title}
                  </h2>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="space-y-4">
                    {currentSectionData?.items?.map((item, index) => {
                      const key = `${currentSection}-${index}`;
                      const selectedStatus = plantStatusAnswers[key];

                      return (
                        <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 mb-3">
                            {index + 1}. {item.name}
                          </h3>
                          
                          <div className="flex space-x-4">
                            {[
                              { value: 'bueno', label: 'Bueno', color: 'bg-green-500 hover:bg-green-600' },
                              { value: 'regular', label: 'Regular', color: 'bg-yellow-500 hover:bg-yellow-600' },
                              { value: 'malo', label: 'Malo', color: 'bg-red-500 hover:bg-red-600' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handlePlantStatusAnswer(index, option.value)}
                                className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                                  selectedStatus === option.value 
                                    ? option.color + ' ring-2 ring-offset-2 ring-gray-400'
                                    : option.color
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón para continuar */}
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleNextSection}
                      disabled={!allQuestionsAnswered || loading}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {currentSection < totalSections - 1 ? 'Siguiente Sección' : 'Finalizar Evaluación'}
                      </span>
                    </Button>
                  </div>

                  {/* Contador de secciones */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    Sección {currentSection + 1} de {totalSections}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <img
        src="public/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default EvaluationScreenOperacion;