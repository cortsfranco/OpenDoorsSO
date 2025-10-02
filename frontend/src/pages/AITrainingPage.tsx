import React from 'react';
import AITrainingManager from '@/components/AITrainingManager';

const AITrainingPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Entrenamiento IA</h1>
          <p className="text-gray-600 mt-2">
            Administra el entrenamiento de modelos de IA para reconocimiento de facturas
          </p>
        </div>
      </div>

      <AITrainingManager />
    </div>
  );
};

export default AITrainingPage;
