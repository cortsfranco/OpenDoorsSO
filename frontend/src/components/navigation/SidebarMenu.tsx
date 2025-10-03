import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
  permission?: string;
}

interface SidebarMenuProps {
  items: MenuItem[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}

interface MenuItemComponentProps {
  item: MenuItem;
  level: number;
  activeItem?: string;
  onItemClick: (itemId: string) => void;
}

function MenuItemComponent({ item, level, activeItem, onItemClick }: MenuItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeItem === item.id;
  const isParentActive = hasChildren && item.children?.some(child => 
    child.id === activeItem || child.children?.some(grandchild => grandchild.id === activeItem)
  );

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onItemClick(item.id);
    }
  };

  const paddingLeft = level * 12 + 16; // 16px base + 12px per level

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-base rounded-lg',
          'hover:bg-sky-100 focus:outline-none focus:bg-sky-100',
          {
            'bg-blue-600 text-white': isActive,
            'bg-blue-100 text-blue-800': isParentActive && !isActive,
            'text-slate-700': !isActive && !isParentActive,
            'opacity-50 cursor-not-allowed': item.disabled,
            'cursor-pointer': !item.disabled
          }
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <div className="flex items-center space-x-3">
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {item.badge && (
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              {
                'bg-white/20 text-white': isActive,
                'bg-blue-600 text-white': !isActive
              }
            )}>
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            isExpanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {item.children!.map((child) => (
            <MenuItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              activeItem={activeItem}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarMenu({ items, activeItem, onItemClick, className }: SidebarMenuProps) {
  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => (
        <MenuItemComponent
          key={item.id}
          item={item}
          level={0}
          activeItem={activeItem}
          onItemClick={onItemClick}
        />
      ))}
    </nav>
  );
}

// Componente para grupos de menú
interface MenuGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MenuGroup({ title, children, className }: MenuGroupProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h3 className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-1">
        {children}
      </div>
    </div>
  );
}

// Hook para manejar el estado del menú
export function useSidebarMenu(initialActiveItem?: string) {
  const [activeItem, setActiveItem] = useState<string | undefined>(initialActiveItem);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isExpanded = (itemId: string) => expandedItems.has(itemId);

  const isActive = (itemId: string) => activeItem === itemId;

  return {
    activeItem,
    handleItemClick,
    toggleExpanded,
    isExpanded,
    isActive
  };
}

