import React, { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import JefePlantaEvaluation from '@/components/JefePlantaEvaluation';
import ResultsScreen from '@/components/ResultsScreen';
import { Toaster } from '@/components/ui/toaster';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/logo_imcyc_favicon.png';
    document.head.appendChild(favicon);

    document.title = "IMCYC - Evaluación Jefe de Planta";
  }, []);

  const handleLogin = (username) => {
    setUser(username);
    setCurrentScreen('evaluation');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setEvaluationResults(null);
  };

  const handleEvaluationComplete = (results) => {
    setEvaluationResults(results);
    setCurrentScreen('results');
  };

  const handleNewEvaluation = () => {
    setCurrentScreen('evaluation');
    setEvaluationResults(null);
  };

  const handleBackToEvaluation = () => {
    setCurrentScreen('evaluation');
    setEvaluationResults(null);
  };

  return (
    <div className="min-h-screen">
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      
      {currentScreen === 'evaluation' && (
        <JefePlantaEvaluation 
          onComplete={handleEvaluationComplete}
          onLogout={handleLogout}
          username={user}
        />
      )}
      
      {currentScreen === 'results' && (
        <ResultsScreen
          results={evaluationResults}
          onBack={handleBackToEvaluation}
          onNewEvaluation={handleNewEvaluation}
        />
      )}
      
      <Toaster />
    </div>
  );
};

export default App;