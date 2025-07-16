import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface SidebarNavProps {
  items: NavItem[];
  currentPath: string;
  variant?: 'consultant' | 'accountant' | 'admin' | 'client';
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ 
  items, 
  currentPath, 
  variant = 'consultant' 
}) => {
  const getVariantStyles = (isActive: boolean) => {
    const baseStyles = "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors";
    
    switch (variant) {
      case 'consultant':
        return cn(
          baseStyles,
          isActive
            ? "bg-purple-700 text-white"
            : "text-purple-200 hover:bg-purple-700 hover:text-white"
        );
      case 'accountant':
        return cn(
          baseStyles,
          isActive
            ? "bg-blue-700 text-white"
            : "text-blue-200 hover:bg-blue-700 hover:text-white"
        );
      case 'admin':
        return cn(
          baseStyles,
          isActive
            ? "bg-red-700 text-white"
            : "text-red-200 hover:bg-red-700 hover:text-white"
        );
      default:
        return cn(
          baseStyles,
          isActive
            ? "bg-green-700 text-white"
            : "text-green-200 hover:bg-green-700 hover:text-white"
        );
    }
  };

  const getIconStyles = (isActive: boolean) => {
    switch (variant) {
      case 'consultant':
        return cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-purple-300");
      case 'accountant':
        return cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-blue-300");
      case 'admin':
        return cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-red-300");
      default:
        return cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-green-300");
    }
  };

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.title}
            to={item.href}
            className={getVariantStyles(isActive)}
          >
            <Icon className={getIconStyles(isActive)} />
            <div className="flex-1">
              <div>{item.title}</div>
              {isActive && (
                <div className="text-xs opacity-75 mt-0.5">
                  {item.description}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}; 