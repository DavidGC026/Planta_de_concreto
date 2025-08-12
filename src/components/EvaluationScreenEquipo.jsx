import React, { useState, useEffect } from 'react';
import { IMAGES } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Settings, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';
import EquipmentSectionSelector from '@/components/EquipmentSectionSelector';
import EquipmentQuestionnaire from '@/components/EquipmentQuestionnaire';
import permissionsService from '@/services/permissionsService';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [sectionSelectionMode, setSectionSelectionMode] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [canUseSimulation, setCanUseSimulation] = useState(false);

  useEffect(() => {
    if (sectionSelectionMode) {
      loadEvaluationData();
    }
  }, [sectionSelectionMode, selectedPlantType]);

  useEffect(() => {
    const init = async () => {
      const user = apiService.getCurrentUser();
      if (!user) return;
      try {
        const info = await permissionsService.getPermissionsInfo(user.id);
        setCanUseSimulation(user?.rol === 'admin' || user?.rol === 'supervisor' || info.hasFullPermissions);
      } catch (e) {
        setCanUseSimulation(false);
      }
    };
    init();
  }, []);

  const loadEvaluationData = async () => {
    try {
      const params = {
        tipo: 'equipo',
        tipoPlanta: selectedPlantType
      };

      const data = await apiService.getPreguntas(params);
      setEvaluationData(data);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar las preguntas de evaluación"
      });
    }
  };

  // Función para generar evaluación simulada
  const generateSimulatedEvaluation = () => {
    const simulatedSections = [
      { nombre: 'Producción y Mezclado', ponderacion: 19.90 },
      { nombre: 'Transporte y Entrega', ponderacion: 12.04 },
      { nombre: 'Control de Calidad', ponderacion: 18.50 },
      { nombre: 'Mantenimiento', ponderacion: 15.20 },
      { nombre: 'Seguridad y Medio Ambiente', ponderacion: 20.36 },
      { nombre: 'Gestión y Administración', ponderacion: 14.00 }
    ];

    const simulatedAnswers = {};
    const sectionResults = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    simulatedSections.forEach((section, sectionIndex) => {
      const subsectionsPerSection = 4;
      const questionsPerSubsection = 5;
      let sectionCorrect = 0;
      let sectionTotal = 0;

      for (let subIndex = 0; subIndex < subsectionsPerSection; subIndex++) {
        for (let qIndex = 0; qIndex < questionsPerSubsection; qIndex++) {
          const key = `${sectionIndex}-${subIndex}-${qIndex}`;
          const randomValue = Math.random();

          let answer;
          if (randomValue < 0.6) {
            answer = 'bueno';
            sectionCorrect++;
            correctAnswers++;
          } else if (randomValue < 0.8) {
            answer = 'na';
            sectionCorrect++;
            correctAnswers++;
          } else {
            answer = 'no';
          }

          simulatedAnswers[key] = answer;
          sectionTotal++;
          totalQuestions++;
        }
      }

      const sectionPercentage = (sectionCorrect / sectionTotal) * 100;
      sectionResults.push({
        name: section.nombre,
        percentage: sectionPercentage,
        correctAnswers: Math.round(sectionCorrect),
        totalQuestions: sectionTotal,
        ponderacion: section.ponderacion
      });
    });

    const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: overallScore,
      totalAnswers: totalQuestions,
      correctAnswers: Math.round(correctAnswers),
      evaluationTitle: `Evaluación de Equipo Simulada - Planta ${selectedPlantType || 'Mediana'}`,
      sections: simulatedSections,
      sectionResults: sectionResults,
      isEquipmentEvaluation: true,
      isSimulated: true
    };
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEvaluation();

      toast({
        title: "🎯 Evaluación Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setSectionSelectionMode(true);
    setCurrentSection(0);
    setCurrentSubsection(0);
  };

  const handleSectionSelect = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentSubsection(0);
    setEvaluationStarted(true);
    setSectionSelectionMode(false);
  };

  const handleBackToSectionSelection = () => {
    setSectionSelectionMode(true);
    setEvaluationStarted(false);
    setCurrentSection(0);
    setCurrentSubsection(0);
  };

  const handleBackToPlantSelection = () => {
    setSelectedPlantType(null);
    setSectionSelectionMode(false);
    setEvaluationStarted(false);
    setCurrentSection(0);
    setCurrentSubsection(0);
  };

  const handleSectionComplete = (action) => {
    if (action === 'nextSubsection') {
      setCurrentSubsection(prev => prev + 1);
    } else if (action === 'backToSections') {
      setSectionSelectionMode(true);
      setEvaluationStarted(false);
      setCurrentSection(0);
      setCurrentSubsection(0);
    }
  };

  // Pantalla de selección de tipo de planta
  if (!selectedPlantType) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${IMAGES.FONDO}")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 pt-24">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo</h2>
              <p className="text-white/80">Selecciona el tipo de planta a evaluar</p>
            </div>

            {/* Botón para saltar a resultados simulados (solo admin/supervisor) */}
            {canUseSimulation && (
              <div className="mb-6 flex justify-center">
                <Button
                  onClick={handleSkipToResults}
                  variant="outline"
                  size="lg"
                  className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2 px-6 py-3"
                >
                  <Zap className="w-5 h-5" />
                  <span>Ver Evaluación Simulada</span>
                </Button>
              </div>
            )}

            {['pequena', 'mediana', 'grande'].map((plantType, index) => (
              <motion.div
                key={plantType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handlePlantTypeSelect(plantType)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium block">
                        Planta {plantType.charAt(0).toUpperCase() + plantType.slice(1)}
                      </span>
                      <span className="text-gray-600 text-sm">
                        Evaluación de equipos para planta {plantType}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <img
          src={IMAGES.CONCRETON}
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
        />
      </div>
    );
  }

  // Pantalla de selección de secciones
  if (sectionSelectionMode) {
    return (
      <EquipmentSectionSelector
        selectedPlantType={selectedPlantType}
        onBack={handleBackToPlantSelection}
        onSectionSelect={handleSectionSelect}
        onSkipToResults={handleSkipToResults}
      />
    );
  }

  // Pantalla de cuestionario
  if (evaluationStarted) {
    return (
      <EquipmentQuestionnaire
        selectedPlantType={selectedPlantType}
        evaluationData={evaluationData}
        currentSection={currentSection}
        currentSubsection={currentSubsection}
        onBack={handleBackToSectionSelection}
        onComplete={onComplete}
        onSkipToResults={handleSkipToResults}
        onSectionComplete={handleSectionComplete}
      />
    );
  }

  return null;
};

export default EvaluationScreenEquipo;
