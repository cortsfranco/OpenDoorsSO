import React from 'react';
import ProjectCashFlowManager from '@/components/ProjectCashFlowManager';

const ProjectCashFlowPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow por Proyecto</h1>
          <p className="text-gray-600 mt-2">
            Seguimiento financiero detallado por proyecto individual
          </p>
        </div>
      </div>

      <ProjectCashFlowManager />
    </div>
  );
};

export default ProjectCashFlowPage;
