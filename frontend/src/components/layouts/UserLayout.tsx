import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { BusinessSelector } from '@/components/ui/business-selector';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Activity,
  Target,
  PieChart,
  Upload,
  Settings,
  User,
  Wallet
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    href: '/user/overview',
    icon: BarChart3,
    description: 'Personal finance dashboard and summary'
  },
  {
    name: 'Transactions',
    href: '/user/transactions',
    icon: Activity,
    description: 'View and manage your transactions'
  },
  {
    name: 'Goals',
    href: '/user/goals',
    icon: Target,
    description: 'Create and track financial goals'
  },
  {
    name: 'Analytics',
    href: '/user/analytics',
    icon: PieChart,
    description: 'Personal finance analytics and insights'
  },
  {
    name: 'Documents',
    href: '/user/documents',
    icon: Upload,
    description: 'Upload receipts and financial documents'
  },
  {
    name: 'Settings',
    href: '/user/settings',
    icon: Settings,
    description: 'Profile and account preferences'
  }
];

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getCurrentSectionName = () => {
    const currentPath = location.pathname;
    const navItem = navigation.find(item => item.href === currentPath);
    return navItem?.name || 'Personal Finance';
  };

  const subtitle = `Welcome back, ${user?.email}`;

  return (
    <DashboardLayout title="Personal Finance Dashboard" subtitle={subtitle}>
      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Business Context */}
          <BusinessSelector variant="sidebar" showAddBusiness={true} className="w-full" />
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                <p className="text-sm text-gray-500">Personal finance sections</p>
              </div>
            </div>
            
            <nav className="space-y-1">
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
                        ? "bg-green-100 text-green-700 border-r-2 border-green-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-green-700" : "text-gray-400"
                    )} />
                    <div>
                      <div>{item.name}</div>
                      {isActive && (
                        <div className="text-xs text-green-600 mt-0.5">
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
               'Manage your personal finances and track your financial goals'}
            </p>
          </div>
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}; 