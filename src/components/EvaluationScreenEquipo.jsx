import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Wrench, Building2, Zap, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

// Definición de tipos de plantas
const plantTypes = [
  { id: "pequena", name: "Planta pequeña" },
  { id: "mediana", name: "Planta mediana" },
  { id: "grande", name: "Planta grande" }
];

// Definición de secciones de evaluación de equipo
const equipmentSections = [
  { 
    id: "produccion", 
    name: "Producción y mezclado", 
    ponderacion: 19.90,
    subsections: [
      { id: "mezcladora", name: "Mezcladora Principal", ponderacion: 3.32 },
      { id: "dosificacion", name: "Sistema de Dosificación", ponderacion: 3.32 },
      { id: "bandas", name: "Bandas Transportadoras", ponderacion: 3.32 },
      { id: "tolvas", name: "Tolvas y Silos", ponderacion: 3.32 },
      { id: "agua", name: "Sistema de Agua", ponderacion: 3.32 },
      { id: "control", name: "Sistema de Control", ponderacion: 3.30 }
    ]
  },
  { 
    id: "transporte", 
    name: "Transporte y entrega", 
    ponderacion: 12.04,
    subsections: [
      { id: "camiones", name: "Camiones Revolvedores", ponderacion: 3.01 },
      { id: "bombas", name: "Bombas de Concreto", ponderacion: 3.01 },
      { id: "carga", name: "Sistemas de Carga", ponderacion: 3.01 },
      { id: "limpieza", name: "Equipos de Limpieza", ponderacion: 3.01 }
    ]
  },
  { 
    id: "calidad", 
    name: "Control de calidad", 
    ponderacion: 18.50,
    subsections: [
      { id: "laboratorio", name: "Equipos de Laboratorio", ponderacion: 3.70 },
      { id: "medicion", name: "Instrumentos de Medición", ponderacion: 3.70 },
      { id: "muestreo", name: "Equipos de Muestreo", ponderacion: 3.70 },
      { id: "curado", name: "Sistemas de Curado", ponderacion: 3.70 },
      { id: "pruebas", name: "Equipos de Pruebas", ponderacion: 3.70 }
    ]
  },
  { 
    id: "mantenimiento", 
    name: "Mantenimiento", 
    ponderacion: 15.20,
    subsections: [
      { id: "herramientas", name: "Herramientas de Mantenimiento", ponderacion: 3.80 },
      { id: "diagnostico", name: "Equipos de Diagnóstico", ponderacion: 3.80 },
      { id: "lubricacion", name: "Sistemas de Lubricación", ponderacion: 3.80 },
      { id: "soldadura", name: "Equipos de Soldadura", ponderacion: 3.80 }
    ]
  },
  { 
    id: "seguridad", 
    name: "Seguridad y medio ambiente", 
    ponderacion: 20.36,
    subsections: [
      { id: "incendios", name: "Equipos Contra Incendios", ponderacion: 3.39 },
      { id: "proteccion", name: "Equipos de Protección Personal", ponderacion: 3.39 },
      { id: "polvo", name: "Control de Polvo", ponderacion: 3.39 },
      { id: "agua", name: "Tratamiento de Aguas", ponderacion: 3.39 },
      { id: "emergencia", name: "Sistemas de Emergencia", ponderacion: 3.40 },
      { id: "monitoreo", name: "Monitoreo Ambiental", ponderacion: 3.40 }
    ]
  },
  { 
    id: "gestion", 
    name: "Gestión y administración", 
    ponderacion: 14.00,
    subsections: [
      { id: "informaticos", name: "Sistemas Informáticos", ponderacion: 3.50 },
      { id: "comunicacion", name: "Equipos de Comunicación", ponderacion: 3.50 },
      { id: "pesaje", name: "Sistemas de Pesaje", ponderacion: 3.50 },
      { id: "oficina", name: "Equipos de Oficina", ponderacion: 3.50 }
    ]
  }
];

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [answers, setAnswers] = useState({});
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionSelection, setShowSectionSelection] = useState(false);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [completedSubsections, setCompletedSubsections] = useState({});

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Scroll al inicio cuando cambia la subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentSubsectionIndex]);

  // Función para generar evaluación simulada de equipo
  const generateSimulatedEquipmentEvaluation = () => {
    const simulatedAnswers = {};
    const simulatedSections = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    equipmentSections.forEach((section, sectionIndex) => {
      const sectionQuestions = [];
      
      section.subsections.forEach((subsection, subsectionIndex) => {
        // Generar 5 preguntas por subsección
        for (let i = 0; i < 5; i++) {
          const questionKey = `${section.id}-${subsection.id}-${i}`;
          
          // Generar respuesta aleatoria con tendencia hacia respuestas positivas
          const randomValue = Math.random();
          let answer;
          
          if (randomValue < 0.75) { // 75% probabilidad de respuesta correcta
            answer = 'si';
            correctAnswers++;
          } else if (randomValue < 0.9) { // 15% probabilidad de respuesta incorrecta
            answer = 'no';
          } else { // 10% probabilidad de N/A
            answer = 'na';
          }
          
          simulatedAnswers[questionKey] = answer;
          totalQuestions++;

          // Crear pregunta simulada
          sectionQuestions.push({
            id: i,
            pregunta_id: i,
            pregunta: `¿Los equipos de ${subsection.name.toLowerCase()} están en óptimas condiciones de funcionamiento?`,
            tipo_pregunta: 'abierta',
            es_trampa: false
          });
        }
      });

      simulatedSections.push({
        ...section,
        preguntas: sectionQuestions
      });
    });

    // Calcular puntuación simulada
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Crear objeto de resultados simulados
    const simulatedResults = {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - ${selectedPlantType || 'Planta Genérica'}`,
      sections: simulatedSections,
      isEquipmentEvaluation: true,
      isSimulated: true
    };

    return simulatedResults;
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEquipmentEvaluation();
      
      toast({
        title: "🎯 Evaluación de Equipo Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated equipment evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  // Generar preguntas para una subsección
  const generateQuestionsForSubsection = (subsectionId) => {
    const questions = [];
    const subsection = findSubsection(subsectionId);
    
    if (!subsection) return [];

    // Preguntas predefinidas para subsecciones específicas
    const predefinedQuestions = {
      "mezcladora": [
        "¿La mezcladora principal se encuentra estructuralmente íntegra, sin fugas, grietas visibles ni desgaste severo en las paletas?",
        "¿Los motores de la mezcladora operan sin vibraciones anormales, sobrecalentamiento o ruidos extraños?",
        "¿El sistema de transmisión (reductores, acoplamientos) funciona correctamente sin fugas de aceite?",
        "¿Las paletas mezcladoras mantienen la geometría adecuada y están firmemente sujetas?",
        "¿El sistema de descarga de la mezcladora opera sin obstrucciones y con sellado adecuado?"
      ],
      "dosificacion": [
        "¿Las básculas de cemento están calibradas y funcionan dentro de los parámetros de tolerancia especificados?",
        "¿Las básculas de agregados mantienen la precisión requerida y están libres de interferencias?",
        "¿El sistema de dosificación de agua cuenta con medidores calibrados y válvulas en buen estado?",
        "¿Los sistemas de dosificación de aditivos operan con precisión y están libres de obstrucciones?",
        "¿Las celdas de carga de las básculas están protegidas y funcionan correctamente?"
      ],
      "bandas": [
        "¿Las bandas transportadoras operan sin deslizamientos, desalineaciones o daños en la superficie?",
        "¿Los motores y reductores de las bandas funcionan sin vibraciones anormales ni sobrecalentamiento?",
        "¿Los rodillos de soporte están alineados y giran libremente sin desgaste excesivo?",
        "¿Los sistemas de limpieza de bandas (raspadores) funcionan correctamente?",
        "¿Las protecciones de seguridad de las bandas están instaladas y en buen estado?"
      ],
      "tolvas": [
        "¿Los silos de cemento mantienen hermeticidad y están libres de grietas o corrosión?",
        "¿Las tolvas de agregados están libres de obstrucciones y sus compuertas operan correctamente?",
        "¿Los sistemas de descarga de silos funcionan sin obstrucciones ni fugas de aire?",
        "¿Los sensores de nivel en silos y tolvas proporcionan lecturas precisas y confiables?",
        "¿Las estructuras de soporte de silos y tolvas están en condiciones seguras?"
      ],
      "camiones": [
        "¿Los tambores revolvedores mantienen la integridad estructural sin grietas, deformaciones ni corrosión severa?",
        "¿El sistema hidráulico de los camiones opera sin fugas y mantiene la presión adecuada?",
        "¿Las paletas internas del tambor están completas, bien fijadas y con geometría adecuada?",
        "¿Los motores hidráulicos del tambor funcionan sin ruidos anormales ni sobrecalentamiento?",
        "¿Los neumáticos están en condiciones óptimas con presión adecuada y sin desgaste irregular?"
      ],
      "bombas": [
        "¿Las bombas de concreto funcionan sin obstrucciones y mantienen el caudal especificado?",
        "¿Las mangueras y conexiones están libres de desgaste excesivo y fugas?",
        "¿El sistema hidráulico de las bombas opera sin fugas y con presión adecuada?",
        "¿Los sistemas de limpieza de tuberías funcionan correctamente?",
        "¿Las válvulas de cambio (S-valve) operan suavemente sin obstrucciones?"
      ],
      "laboratorio": [
        "¿La prensa de compresión está calibrada y opera dentro de los parámetros de precisión requeridos?",
        "¿Los moldes para especímenes están en buenas condiciones y libres de deformaciones?",
        "¿La balanza de laboratorio mantiene la precisión requerida y está debidamente calibrada?",
        "¿Los equipos de curado mantienen temperatura y humedad controladas?",
        "¿Los instrumentos de medición están calibrados y certificados?"
      ]
    };

    // Si hay preguntas predefinidas para esta subsección, usarlas
    if (predefinedQuestions[subsectionId]) {
      return predefinedQuestions[subsectionId].map((pregunta, index) => ({
        id: index,
        pregunta_id: index,
        pregunta,
        tipo_pregunta: 'abierta',
        es_trampa: false
      }));
    }

    // Si no hay preguntas predefinidas, generar preguntas genéricas
    const numQuestions = 5; // Número estándar de preguntas por subsección
    for (let i = 0; i < numQuestions; i++) {
      let pregunta = "";
      switch (i) {
        case 0:
          pregunta = `¿Los equipos de ${subsection.name.toLowerCase()} están en buenas condiciones de funcionamiento?`;
          break;
        case 1:
          pregunta = `¿Se realiza mantenimiento preventivo regular a los equipos de ${subsection.name.toLowerCase()}?`;
          break;
        case 2:
          pregunta = `¿Los equipos de ${subsection.name.toLowerCase()} cumplen con las especificaciones técnicas requeridas?`;
          break;
        case 3:
          pregunta = `¿Existe documentación actualizada para los equipos de ${subsection.name.toLowerCase()}?`;
          break;
        case 4:
          pregunta = `¿El personal está capacitado para operar los equipos de ${subsection.name.toLowerCase()}?`;
          break;
      }

      questions.push({
        id: i,
        pregunta_id: i,
        pregunta,
        tipo_pregunta: 'abierta',
        es_trampa: false
      });
    }

    return questions;
  };

  // Encontrar una subsección por su ID
  const findSubsection = (subsectionId) => {
    for (const section of equipmentSections) {
      const subsection = section.subsections.find(sub => sub.id === subsectionId);
      if (subsection) {
        return subsection;
      }
    }
    return null;
  };

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setShowSectionSelection(true);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setCurrentSubsectionIndex(0);
    setEvaluationStarted(true);
    
    // Cargar preguntas para la primera subsección
    const firstSubsection = section.subsections[0];
    const questions = generateQuestionsForSubsection(firstSubsection.id);
    setCurrentQuestions(questions);
  };

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedSection.id}-${selectedSection.subsections[currentSubsectionIndex].id}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveCurrentSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSubsection = selectedSection.subsections[currentSubsectionIndex];

      // Calcular progreso de la subsección actual (solo preguntas normales)
      let subsectionScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      const subsectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${selectedSection.id}-${currentSubsection.id}-`));
      
      totalQuestions = subsectionAnswers.length;
      subsectionAnswers.forEach(([key, answer]) => {
        if (answer === 'si') {
          subsectionScore += 10;
          correctAnswers++;
        }
      });

      const subsectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de subsección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        seccion_nombre: `${selectedSection.name} - ${currentSubsection.name}`,
        seccion_orden: selectedSection.id.charCodeAt(0) * 100 + currentSubsectionIndex,
        puntaje_seccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType,
        categoria: selectedSection.id
      });

      // Marcar subsección como completada
      setCompletedSubsections(prev => ({
        ...prev,
        [`${selectedSection.id}-${currentSubsection.id}`]: true
      }));

    } catch (error) {
      console.error('Error saving subsection progress:', error);
    }
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveCurrentSubsectionProgress();
    
    // Si hay más subsecciones en la sección actual
    if (currentSubsectionIndex < selectedSection.subsections.length - 1) {
      const nextSubsectionIndex = currentSubsectionIndex + 1;
      setCurrentSubsectionIndex(nextSubsectionIndex);
      
      // Cargar preguntas para la siguiente subsección
      const nextSubsection = selectedSection.subsections[nextSubsectionIndex];
      const questions = generateQuestionsForSubsection(nextSubsection.id);
      setCurrentQuestions(questions);
    } 
    // Si no hay más subsecciones, completar la evaluación de esta sección
    else {
      await completeSectionEvaluation();
    }
  };

  const completeSectionEvaluation = async () => {
    try {
      setLoading(true);

      // Marcar todas las subsecciones como completadas
      const updatedCompletedSubsections = { ...completedSubsections };
      selectedSection.subsections.forEach(subsection => {
        updatedCompletedSubsections[`${selectedSection.id}-${subsection.id}`] = true;
      });
      setCompletedSubsections(updatedCompletedSubsections);

      // Volver a la selección de secciones
      setEvaluationStarted(false);
      setSelectedSection(null);
      setCurrentSubsectionIndex(0);
      setShowSectionSelection(true);

      toast({
        title: "✅ Sección completada",
        description: `La evaluación de ${selectedSection.name} ha sido completada exitosamente`
      });

    } catch (error) {
      console.error('Error completing section evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo completar la evaluación de la sección. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);

      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular puntuación total (solo preguntas normales)
      let totalScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      Object.entries(answers).forEach(([key, answer]) => {
        totalQuestions++;
        if (answer === 'si') {
          totalScore += 10;
          correctAnswers++;
        }
      });

      const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        tipo_planta: selectedPlantType,
        categoria: 'completa',
        respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
          const [sectionId, subsectionId, questionIndex] = key.split('-');
          
          return {
            pregunta_id: questionIndex,
            respuesta: selectedAnswer,
            observacion: `Sección: ${sectionId}, Subsección: ${subsectionId}`
          };
        }),
        observaciones: `Evaluación de equipo completada - Tipo: ${selectedPlantType}`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: finalScore,
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: `Evaluación de Equipo - ${selectedPlantType}`,
        sections: equipmentSections,
        isEquipmentEvaluation: true
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

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = () => {
    if (!currentQuestions || !selectedSection) return false;
    
    const currentSubsection = selectedSection.subsections[currentSubsectionIndex];
    
    return currentQuestions.every((_, index) => {
      const key = `${selectedSection.id}-${currentSubsection.id}-${index}`;
      return answers[key] !== undefined;
    });
  };

  // Calcular estadísticas simplificadas
  const calculateSimpleStats = () => {
    if (!evaluationStarted || !selectedSection) return null;

    const currentSubsection = selectedSection.subsections[currentSubsectionIndex];
    
    // Calcular progreso general
    let totalAnsweredQuestions = 0;
    let totalPossibleQuestions = 0;
    
    // Calcular solo para la sección actual
    selectedSection.subsections.forEach((subsection) => {
      // Asumimos 5 preguntas por subsección
      const numQuestions = 5;
      totalPossibleQuestions += numQuestions;
      
      // Contar respuestas para esta subsección
      let subsectionAnswers = 0;
      
      for (let i = 0; i < numQuestions; i++) {
        const key = `${selectedSection.id}-${subsection.id}-${i}`;
        if (answers[key]) {
          subsectionAnswers++;
        }
      }
      
      totalAnsweredQuestions += subsectionAnswers;
    });
    
    const progressPercentage = totalPossibleQuestions > 0 ? (totalAnsweredQuestions / totalPossibleQuestions) * 100 : 0;
    
    // Calcular respuestas por tipo solo para la sección actual
    const responseStats = {
      si: 0,
      no: 0,
      na: 0
    };
    
    let correctAnswers = 0;
    
    Object.entries(answers).forEach(([key, answer]) => {
      if (key.startsWith(`${selectedSection.id}-`) && responseStats.hasOwnProperty(answer)) {
        responseStats[answer]++;
        if (answer === 'si') {
          correctAnswers++;
        }
      }
    });
    
    // Calcular progreso de las subsecciones de la sección actual
    const currentSectionProgress = selectedSection.subsections.map(subsection => {
      const isCurrentSubsection = subsection.id === currentSubsection.id;
      const isCompleted = completedSubsections[`${selectedSection.id}-${subsection.id}`] || false;
      
      return {
        ...subsection,
        isCurrentSubsection,
        isCompleted
      };
    });
    
    return {
      totalAnsweredQuestions,
      totalPossibleQuestions,
      progressPercentage,
      responseStats,
      correctAnswers,
      currentSectionProgress,
      currentScore: totalAnsweredQuestions > 0 ? Math.round((correctAnswers / totalAnsweredQuestions) * 100) : 0
    };
  };

  const simpleStats = calculateSimpleStats();

  // Verificar si todas las secciones están completas
  const allSectionsCompleted = () => {
    if (!selectedPlantType) return false;
    
    // Contar cuántas secciones tienen todas sus subsecciones completadas
    let completedSections = 0;
    
    equipmentSections.forEach(section => {
      const allSubsectionsCompleted = section.subsections.every(
        subsection => completedSubsections[`${section.id}-${subsection.id}`]
      );
      
      if (allSubsectionsCompleted) {
        completedSections++;
      }
    });
    
    return completedSections === equipmentSections.length;
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación de equipo...</p>
        </div>
      </div>
    );
  }

  // Pantalla de selección de tipo de planta
  if (!selectedPlantType) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo</h2>
              <p className="text-white/80">Seleccione el tipo de planta a evaluar</p>
            </div>

            {/* Botón para saltar a resultados simulados */}
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

            <h3 className="text-xl font-semibold text-white mb-4">Tipo de planta:</h3>
            <div className="space-y-4">
              {plantTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handlePlantTypeSelect(type.id)}
                    className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-gray-800 font-medium block">{type.name}</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // Pantalla de selección de sección
  if (showSectionSelection && !evaluationStarted) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo - {selectedPlantType}</h2>
              <p className="text-white/80">Seleccione la sección a evaluar</p>
            </div>

            {/* Botón para saltar a resultados simulados */}
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

            <div className="space-y-4">
              {equipmentSections.map((section, index) => {
                // Verificar si todas las subsecciones de esta sección están completadas
                const allSubsectionsCompleted = section.subsections.every(
                  subsection => completedSubsections[`${section.id}-${subsection.id}`]
                );
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleSectionSelect(section)}
                      className={`w-full backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border ${
                        allSubsectionsCompleted 
                          ? 'bg-green-50/90 border-green-300 hover:bg-green-100/90' 
                          : 'bg-white/90 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            allSubsectionsCompleted ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <Wrench className={`w-5 h-5 ${
                              allSubsectionsCompleted ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <span className="text-gray-800 font-medium block">{section.name}</span>
                            <span className="text-sm text-gray-600">{section.subsections.length} subsecciones</span>
                          </div>
                        </div>
                        {allSubsectionsCompleted && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Botón para finalizar evaluación (visible solo si todas las secciones están completas) */}
            {allSectionsCompleted() && (
              <div className="mt-8">
                <Button
                  onClick={completeEvaluation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-md"
                >
                  Finalizar Evaluación Completa
                </Button>
              </div>
            )}
          </div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // Pantalla principal de evaluación (subsecciones secuenciales)
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
        {/* Botón de desarrollo para saltar a resultados */}
        <div className="mb-4 flex justify-between">
          <Button
            onClick={() => {
              setEvaluationStarted(false);
              setShowSectionSelection(true);
            }}
            variant="outline"
            size="sm"
            className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Secciones</span>
          </Button>
          
          <Button
            onClick={handleSkipToResults}
            variant="outline"
            size="sm"
            className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Saltar a Resultados (Simulado)</span>
          </Button>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Equipo - {selectedPlantType} - {selectedSection?.name}
            </h2>
            {simpleStats && (
              <span className="text-sm text-gray-600">
                {Math.round(simpleStats.progressPercentage)}% completado
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${simpleStats?.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${simpleStats ? 'w-3/5' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedSection?.id}-${currentSubsectionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                  <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 text-center">
                      {selectedSection?.subsections[currentSubsectionIndex]?.name}
                    </h2>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {currentQuestions.map((question, index) => {
                        const key = `${selectedSection.id}-${selectedSection.subsections[currentSubsectionIndex].id}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {index + 1}. {question.pregunta}
                            </h3>
                            
                            {/* Pregunta abierta (Sí/No/NA) */}
                            <div className="space-y-2">
                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="si"
                                  checked={selectedAnswer === 'si'}
                                  onChange={() => handleAnswer(index, 'si')}
                                  className="mr-3 text-green-600 focus:ring-green-500"
                                />
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <span className="text-gray-700">Sí</span>
                              </label>
                              
                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="no"
                                  checked={selectedAnswer === 'no'}
                                  onChange={() => handleAnswer(index, 'no')}
                                  className="mr-3 text-red-600 focus:ring-red-500"
                                />
                                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                <span className="text-gray-700">No</span>
                              </label>
                              
                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="na"
                                  checked={selectedAnswer === 'na'}
                                  onChange={() => handleAnswer(index, 'na')}
                                  className="mr-3 text-gray-600 focus:ring-gray-500"
                                />
                                <MinusCircle className="w-5 h-5 text-gray-600 mr-2" />
                                <span className="text-gray-700">No Aplica</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botón para continuar */}
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleNextSubsection}
                        disabled={!allQuestionsAnswered() || loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {isLastSubsection() 
                            ? 'Completar Sección' 
                            : 'Siguiente Subsección'}
                        </span>
                      </Button>
                    </div>

                    {/* Contador de subsecciones */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                      Subsección {currentSubsectionIndex + 1} de {selectedSection?.subsections.length}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de estadísticas simplificado */}
          {simpleStats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Progreso de {selectedSection?.name}
                  </h3>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Progreso de la sección */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso de la sección</span>
                        <span>{Math.round(simpleStats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${simpleStats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {simpleStats.totalAnsweredQuestions} de {simpleStats.totalPossibleQuestions} preguntas
                      </div>
                    </div>

                    {/* Puntuación actual */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Puntuación Actual</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {simpleStats.currentScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {simpleStats.correctAnswers} correctas de {simpleStats.totalAnsweredQuestions} respondidas
                        </div>
                      </div>
                    </div>

                    {/* Subsecciones de la sección actual */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Subsecciones
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {simpleStats.currentSectionProgress.map((subsection, idx) => (
                          <div key={subsection.id} className={`flex items-center justify-between text-sm p-2 rounded ${
                            subsection.isCurrentSubsection ? 'bg-blue-50 border border-blue-200' : 
                            subsection.isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                subsection.isCompleted ? 'bg-green-500' : 
                                subsection.isCurrentSubsection ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-xs font-medium truncate max-w-[120px]" title={subsection.name}>
                                {idx + 1}. {subsection.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estadísticas de respuestas */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución de respuestas</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span>Sí</span>
                          </div>
                          <span className="font-medium">{simpleStats.responseStats.si}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600 mr-2" />
                            <span>No</span>
                          </div>
                          <span className="font-medium">{simpleStats.responseStats.no}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <MinusCircle className="w-4 h-4 text-gray-600 mr-2" />
                            <span>No Aplica</span>
                          </div>
                          <span className="font-medium">{simpleStats.responseStats.na}</span>
                        </div>
                      </div>
                    </div>

                    {/* Información de configuración */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Tipo de planta: {selectedPlantType}</div>
                        <div>Sección: {selectedSection?.name}</div>
                        <div>Subsección: {selectedSection?.subsections[currentSubsectionIndex]?.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <img
        src="public/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );

  // Función auxiliar para verificar si es la última subsección de la sección actual
  function isLastSubsection() {
    return currentSubsectionIndex === selectedSection?.subsections.length - 1;
  }
};

export default EvaluationScreenEquipo;