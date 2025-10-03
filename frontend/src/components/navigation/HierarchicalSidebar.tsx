import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3, 
  Brain,
  User,
  Trash2,
  Activity,
  Settings,
  Calendar,
  DollarSign,
  PieChart,
  Building2,
  FileSpreadsheet,
  Workflow,
  Shield,
  Bot,
  Database,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { SidebarMenu, MenuGroup, MenuItem } from './SidebarMenu';

interface HierarchicalSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function HierarchicalSidebar({ 
  activeView, 
  onViewChange, 
  className,
  collapsed = false,
  onToggleCollapse 
}: HierarchicalSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['dashboard', 'invoices', 'reports'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const menuStructure: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '#dashboard'
    },
    {
      id: 'invoices',
      label: 'Facturas',
      icon: FileText,
      children: [
        {
          id: 'upload',
          label: 'Cargar Facturas',
          icon: Upload
        },
        {
          id: 'excel-import',
          label: 'Importar Excel',
          icon: FileSpreadsheet
        },
        {
          id: 'history',
          label: 'Historial',
          icon: FileText
        },
        {
          id: 'review-queue',
          label: 'Cola de Revisión',
          icon: Clock,
          badge: '3'
        },
        {
          id: 'approval-queue',
          label: 'Cola de Aprobación',
          icon: Shield,
          badge: '2'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      children: [
        {
          id: 'dual-accounting',
          label: 'Doble Contabilidad',
          icon: PieChart
        },
        {
          id: 'sales-vs-purchases',
          label: 'Ventas vs Compras',
          icon: TrendingUp
        },
        {
          id: 'project-cashflow',
          label: 'Cash Flow Proyectos',
          icon: DollarSign
        },
        {
          id: 'analytics',
          label: 'Analytics Ejecutivos',
          icon: BarChart3
        }
      ]
    },
    {
      id: 'clients',
      label: 'Clientes/Proveedores',
      icon: Building2
    },
    {
      id: 'ai',
      label: 'Inteligencia Artificial',
      icon: Brain,
      children: [
        {
          id: 'ai-assistant',
          label: 'Asistente IA',
          icon: Bot
        },
        {
          id: 'ai-training',
          label: 'Entrenamiento IA',
          icon: Zap
        }
      ]
    },
    {
      id: 'administration',
      label: 'Administración',
      icon: Settings,
      children: [
        {
          id: 'user-management',
          label: 'Gestión de Usuarios',
          icon: Users
        },
        {
          id: 'activity-log',
          label: 'Registro de Actividades',
          icon: Activity
        },
        {
          id: 'system-settings',
          label: 'Configuración del Sistema',
          icon: Database
        }
      ]
    },
    {
      id: 'user',
      label: 'Mi Perfil',
      icon: User
    },
    {
      id: 'trash',
      label: 'Papelera de Reciclaje',
      icon: Trash2
    }
  ];

  return (
    <div className={cn(
      'flex flex-col h-full bg-sky-50/80 backdrop-blur-sm border-r border-sky-200 transition-base',
      {
        'w-64': !collapsed,
        'w-16': collapsed
      },
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sky-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OD</span>
            </div>
            <span className="font-semibold text-slate-800">Open Doors</span>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-sky-100 transition-base text-slate-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {collapsed ? (
          // Vista colapsada - solo iconos
          <div className="space-y-1">
            {menuStructure.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full p-3 rounded-lg transition-base flex items-center justify-center',
                  'hover:bg-sky-100',
                  {
                    'bg-blue-600 text-white': activeView === item.id,
                    'text-slate-700': activeView !== item.id
                  }
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          // Vista expandida - menú completo
          <div className="space-y-4">
            {/* Sección Principal */}
            <MenuGroup title="Principal">
              <SidebarMenu
                items={menuStructure.slice(0, 3)}
                activeItem={activeView}
                onItemClick={onViewChange}
              />
            </MenuGroup>

            {/* Sección Gestión */}
            <MenuGroup title="Gestión">
              <SidebarMenu
                items={menuStructure.slice(3, 5)}
                activeItem={activeView}
                onItemClick={onViewChange}
              />
            </MenuGroup>

            {/* Sección Administración */}
            <MenuGroup title="Administración">
              <SidebarMenu
                items={menuStructure.slice(5)}
                activeItem={activeView}
                onItemClick={onViewChange}
              />
            </MenuGroup>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sky-200">
        {!collapsed && (
          <div className="text-xs text-slate-600 text-center">
            <p>Open Doors v1.0.0</p>
            <p className="mt-1">Sistema de Gestión Empresarial</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para manejar el estado del sidebar
export function useHierarchicalSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return {
    collapsed,
    toggleCollapse
  };
}

