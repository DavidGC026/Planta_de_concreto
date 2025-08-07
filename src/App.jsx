import React, { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import MainMenu from '@/components/MainMenu';
import EvaluationScreenPersonal from '@/components/EvaluationScreenPersonal';
import EvaluationScreenEquipo from '@/components/EvaluationScreenEquipo';
import EvaluationScreenOperacion from '@/components/EvaluationScreenOperacion';
import ResultsScreen from '@/components/ResultsScreen';
import ExamBlockingManagement from '@/components/ExamBlockingManagement';
import ExamBlockedScreen from '@/components/ExamBlockedScreen';
import Navigation from '@/components/ui/navigation';
import { Toaster } from '@/components/ui/toaster';
import apiService from '@/services/api';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/logo_planta_favicon.png';
    document.head.appendChild(favicon);

    document.title = "Sistema de Evaluación de Plantas de Concreto";
  }, []);

  // Efecto para manejar la visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    // Listener para detectar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // También detectar cuando la ventana pierde o gana foco
    const handleWindowBlur = () => setIsPageVisible(false);
    const handleWindowFocus = () => setIsPageVisible(true);

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleLogin = (username) => {
    setUser(username);
    setCurrentScreen('menu');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setCurrentEvaluation(null);
    setEvaluationResults(null);
  };

  const handleSelectEvaluation = (evaluationType) => {
    setCurrentEvaluation(evaluationType);
    setCurrentScreen('evaluation');
    setEvaluationResults(null); // Limpiar resultados previos
  };

  const handleShowBlockedScreen = () => {
    setCurrentScreen('blocked');
    setCurrentEvaluation(null);
    setEvaluationResults(null);
  };

  const handleNavigate = (screenId) => {
    // Limpiar estados al navegar
    setEvaluationResults(null);
    
    if (screenId === 'menu') {
      setCurrentScreen('menu');
      setCurrentEvaluation(null);
    } else if (['personal', 'equipo', 'operacion'].includes(screenId)) {
      setCurrentEvaluation(screenId);
      setCurrentScreen('evaluation');
    }
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setCurrentEvaluation(null);
    setEvaluationResults(null);
  };

  const handleEvaluationComplete = (results) => {
    setEvaluationResults(results);
    setCurrentScreen('results');
  };

  const handleNewEvaluation = () => {
    setCurrentScreen('menu');
    setCurrentEvaluation(null);
    setEvaluationResults(null);
  };

  // Función para saltar a resultados con puntuación perfecta (solo para desarrollo)
  const handleSkipToResults = () => {
    const mockResults = {
      answers: {},
      score: 100,
      totalAnswers: 10,
      evaluationTitle: 'Evaluación de Desarrollo',
      sections: [
        {
          title: 'Sección de Prueba',
          questions: Array.from({ length: 10 }, (_, i) => ({
            text: `Pregunta ${i + 1}`,
            answer: 'si'
          }))
        }
      ]
    };
    setEvaluationResults(mockResults);
    setCurrentScreen('results');
  };

  // Renderizar el componente de evaluación correcto según el tipo
  const renderEvaluationScreen = () => {
    const commonProps = {
      onBack: handleBackToMenu,
      onComplete: handleEvaluationComplete,
      onSkipToResults: handleSkipToResults,
      username: user
    };

    switch (currentEvaluation) {
      case 'personal':
        return <EvaluationScreenPersonal {...commonProps} />;
      case 'equipo':
        return <EvaluationScreenEquipo {...commonProps} />;
      case 'operacion':
        return <EvaluationScreenOperacion {...commonProps} />;
      default:
        return <div>Tipo de evaluación no válido</div>;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${!isPageVisible ? 'blur-md opacity-75' : ''}`}>
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      
      {currentScreen !== 'login' && (
        <>
          <Navigation 
            currentScreen={currentScreen}
            currentEvaluation={currentEvaluation}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            username={user}
          />
          
          {currentScreen === 'menu' && (
            <MainMenu 
              onSelectEvaluation={handleSelectEvaluation}
              onShowBlockedScreen={handleShowBlockedScreen}
              onLogout={handleLogout}
              username={user}
            />
          )}
          
          {currentScreen === 'evaluation' && renderEvaluationScreen()}
          
          {currentScreen === 'blocked' && (
            <ExamBlockedScreen
              currentUser={apiService.getCurrentUser()}
              onBack={handleBackToMenu}
            />
          )}
          
          {currentScreen === 'results' && (
            <ResultsScreen
              results={evaluationResults}
              onBack={handleBackToMenu}
              onNewEvaluation={handleNewEvaluation}
            />
          )}
        </>
      )}
      
      <Toaster />
      
      {/* Overlay de blur cuando la página pierde el foco */}
      {!isPageVisible && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-none transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-gray-200">
              <p className="text-gray-800 font-medium text-center">
                La página está fuera de foco
              </p>
              <p className="text-gray-600 text-sm text-center mt-1">
                Haz clic aquí para continuar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;