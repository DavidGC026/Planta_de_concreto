import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

const SectionCompletionModal = ({ 
  isOpen, 
  onClose, 
  sectionName, 
  completedQuestions, 
  totalQuestions, 
  onContinue 
}) => {
  if (!isOpen) return null;

  const completionPercentage = Math.round((completedQuestions / totalQuestions) * 100);
  const isComplete = completedQuestions === totalQuestions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isComplete ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">
            {isComplete ? 'Sección Completada' : 'Progreso de Sección'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            <strong>{sectionName}</strong>
          </p>
          <div className="mb-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {completionPercentage}%
            </div>
            <div className="text-sm text-gray-500">
              {completedQuestions} de {totalQuestions} preguntas completadas
            </div>
          </div>
          <div className="flex justify-center space-x-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Cerrar
            </Button>
            <Button 
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionCompletionModal;
