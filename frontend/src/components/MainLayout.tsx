/**
 * Layout principal de la aplicación con navegación lateral y barra superior.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import FinancialOverview from './FinancialOverview';
import InvoiceHistoryTable from './InvoiceHistoryTable';
import UploadInvoicePage from './UploadInvoicePage';
import TrashPage from '../pages/TrashPage';
import SalesVsPurchasesPage from '../pages/SalesVsPurchasesPage';
import ClientsSuppliersPage from '../pages/ClientsSuppliersPage';
import ReportsPage from '../pages/ReportsPage';
import ExecutiveAnalyticsPage from '../pages/ExecutiveAnalyticsPage';
import ApprovalQueuePage from '../pages/ApprovalQueuePage';
import ActivityLogPage from '../pages/ActivityLogPage';
import UserSettingsPage from '../pages/UserSettingsPage';
import UserManagementPage from '../pages/UserManagementPage';
import AITrainingPage from '../pages/AITrainingPage';
import ExcelImportPage from '../pages/ExcelImportPage';
import ProjectCashFlowPage from '../pages/ProjectCashFlowPage';
import { DualAccountingReportsPage } from '../pages/DualAccountingReportsPage';
import AIAssistant from './AIAssistant';
import { HierarchicalSidebar, useHierarchicalSidebar } from './navigation/HierarchicalSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3, 
  Brain,
  LogOut,
  User,
  Trash2,
  Activity,
  Menu,
  X
} from 'lucide-react';

// Tipos para las vistas
type ViewType = 
  | 'dashboard' 
  | 'upload' 
  | 'history' 
  | 'sales-vs-purchases' 
  | 'review-queue' 
  | 'approval-queue'
  | 'clients' 
  | 'reports' 
  | 'analytics'
  | 'activity-log'
  | 'trash'
  | 'user-management'
  | 'user-settings'
  | 'ai-training'
  | 'excel-import'
  | 'project-cashflow'
  | 'dual-accounting';

// Configuración del menú de navegación
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Cargar Facturas', icon: Upload },
  { id: 'excel-import', label: 'Importar Excel', icon: Upload },
  { id: 'history', label: 'Historial Facturas', icon: FileText },
  { id: 'sales-vs-purchases', label: 'Ventas vs Compras', icon: TrendingUp },
  { id: 'review-queue', label: 'Cola de Revisión', icon: Clock },
  { id: 'approval-queue', label: 'Cola de Aprobación', icon: Clock },
  { id: 'clients', label: 'Clientes/Proveedores', icon: Users },
  { id: 'reports', label: 'Reportes', icon: BarChart3 },
  { id: 'dual-accounting', label: 'Doble Contabilidad', icon: BarChart3 },
  { id: 'analytics', label: 'Analytics Ejecutivos', icon: BarChart3 },
  { id: 'project-cashflow', label: 'Cash Flow Proyectos', icon: TrendingUp },
  { id: 'activity-log', label: 'Registro de Actividades', icon: Activity },
  { id: 'user-management', label: 'Gestión de Usuarios', icon: Users },
  { id: 'ai-training', label: 'Entrenamiento IA', icon: Brain },
  { id: 'user-settings', label: 'Mi Perfil', icon: User },
  { id: 'trash', label: 'Papelera de Reciclaje', icon: Trash2 },
];

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { collapsed, toggleCollapse } = useHierarchicalSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Obtener la vista activa desde la URL
  const getActiveViewFromPath = (pathname: string): string => {
    const path = pathname.replace('/', '') || 'dashboard';
    return path;
  };

  const activeView = getActiveViewFromPath(location.pathname);

  // Función para cambiar de vista usando React Router
  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
  };

  // Si no está autenticado, mostrar la página de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Componente para renderizar el contenido según la vista activa
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <FinancialOverview />;
      case 'upload':
        return <UploadInvoicePage />;
      case 'history':
        return <InvoiceHistoryTable />;
      case 'sales-vs-purchases':
        return <SalesVsPurchasesPage />;
      case 'review-queue':
        return <div className="main-container"><h2 className="text-2xl font-bold">Cola de Revisión</h2><p>En desarrollo...</p></div>;
      case 'approval-queue':
        return <ApprovalQueuePage />;
      case 'clients':
        return <ClientsSuppliersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'dual-accounting':
        return <DualAccountingReportsPage />;
      case 'analytics':
        return <ExecutiveAnalyticsPage />;
      case 'activity-log':
        return <ActivityLogPage />;
      case 'trash':
        return <TrashPage />;
      case 'user-management':
        return <UserManagementPage />;
      case 'ai-training':
        return <AITrainingPage />;
      case 'excel-import':
        return <ExcelImportPage />;
      case 'project-cashflow':
        return <ProjectCashFlowPage />;
      case 'user-settings':
        return <UserSettingsPage />;
      default:
        return <FinancialOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Jerárquico */}
      <HierarchicalSidebar
        activeView={activeView}
        onViewChange={(view) => {
          handleViewChange(view);
          setSidebarOpen(false); // Cerrar sidebar en móvil después de seleccionar
        }}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        className={`
          fixed lg:relative lg:translate-x-0 z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      />

      {/* Área de contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón hamburguesa para móvil */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden btn-animated"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">
                  {menuItems.find(item => item.id === activeView)?.label}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {/* Información del usuario */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'usuario'}
                </p>
              </div>
              
              {/* Avatar */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              {/* Botón de logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 btn-animated"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="min-h-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Asistente de IA flotante */}
      <AIAssistant />
    </div>
  );
};

export default MainLayout;