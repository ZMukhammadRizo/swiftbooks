import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Calendar,
  MessageSquare,
  TrendingUp,
  FileText,
  Target,
  Settings
} from 'lucide-react';
import { SidebarNav } from './SidebarNav';

const consultantNavItems = [
  {
    title: 'Overview',
    href: '/consultant/overview',
    icon: BarChart3,
    description: 'Dashboard and key metrics'
  },
  {
    title: 'Clients',
    href: '/consultant/clients',
    icon: Users,
    description: 'Manage your clients'
  },
  {
    title: 'Consultations',
    href: '/consultant/consultations',
    icon: MessageSquare,
    description: 'Session management'
  },
  {
    title: 'Analytics',
    href: '/consultant/analytics',
    icon: TrendingUp,
    description: 'Client financial analytics'
  },
  {
    title: 'Goals',
    href: '/consultant/goals',
    icon: Target,
    description: 'Track client goals'
  },
  {
    title: 'Reports',
    href: '/consultant/reports',
    icon: FileText,
    description: 'Generate client reports'
  },
  {
    title: 'Schedule',
    href: '/consultant/schedule',
    icon: Calendar,
    description: 'Manage appointments'
  },
  {
    title: 'Settings',
    href: '/consultant/settings',
    icon: Settings,
    description: 'Consultant preferences'
  }
];

export const ConsultantSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Header */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">SwiftBooks</h1>
            <p className="text-xs text-purple-200">Consultant Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <SidebarNav 
          items={consultantNavItems} 
          currentPath={location.pathname}
          variant="consultant"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-purple-700 p-4">
        <div className="flex items-center space-x-2 text-sm text-purple-200">
          <div className="h-2 w-2 rounded-full bg-green-400"></div>
          <span>Consultant Mode Active</span>
        </div>
      </div>
    </div>
  );
}; 