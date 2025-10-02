import React from 'react';
import ExcelImportManager from '@/components/ExcelImportManager';

const ExcelImportPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importación de Excel</h1>
          <p className="text-gray-600 mt-2">
            Importa datos históricos de facturas desde archivos Excel existentes
          </p>
        </div>
      </div>

      <ExcelImportManager />
    </div>
  );
};

export default ExcelImportPage;
