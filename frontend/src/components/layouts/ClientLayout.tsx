import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  MessageSquare,
  Upload,
  Calendar,
  Settings,
  Building,
  Activity,
  DollarSign,
  FileText
} from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    href: '/client/overview',
    icon: BarChart3,
    description: 'Financial dashboard and metrics'
  },
  {
    name: 'AI Assistant',
    href: '/client/ai-assistant',
    icon: MessageSquare,
    description: 'Chat with AI for financial insights'
  },
  {
    name: 'Transactions',
    href: '/client/transactions',
    icon: Activity,
    description: 'View and manage financial transactions'
  },
  {
    name: 'Documents',
    href: '/client/documents',
    icon: Upload,
    description: 'Upload and manage documents'
  },
  {
    name: 'Meetings',
    href: '/client/meetings',
    icon: Calendar,
    description: 'Schedule meetings with accountants'
  },
  {
    name: 'Settings',
    href: '/client/settings',
    icon: Settings,
    description: 'Account and business settings'
  }
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getCurrentSectionName = () => {
    const currentPath = location.pathname;
    const navItem = navigation.find(item => item.href === currentPath);
    return navItem?.name || 'Client Dashboard';
  };

  const subtitle = `Welcome back, ${user?.email}`;

  return (
    <DashboardLayout title="Client Dashboard" subtitle={subtitle}>
      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                <p className="text-sm text-gray-500">Dashboard sections</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-blue-700" : "text-gray-400"
                    )} />
                    <div>
                      <div>{item.name}</div>
                      {isActive && (
                        <div className="text-xs text-blue-600 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {getCurrentSectionName()}
            </h2>
            <p className="text-sm text-gray-600">
              {navigation.find(item => item.href === location.pathname)?.description || 
               'Manage your business finances and operations'}
            </p>
          </div>
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}; 