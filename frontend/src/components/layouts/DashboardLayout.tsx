import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { BusinessSelector } from '@/components/ui/business-selector';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuthWithNavigation } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user } = useAuth();
  const { signOutWithRedirect } = useAuthWithNavigation();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
              
              {/* Business Context - Show for roles that work with businesses */}
              {user && ['client', 'user', 'accountant'].includes(user.role) && (
                <div className="hidden md:block">
                  <BusinessSelector 
                    variant="header" 
                    showAddBusiness={user.role === 'client' || user.role === 'user'}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {actions}
              
              {/* Mobile Business Selector */}
              {user && ['client', 'user', 'accountant'].includes(user.role) && (
                <div className="block md:hidden">
                  <BusinessSelector variant="compact" />
                </div>
              )}
              
              <UserAvatar size="md" showName={false} />
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={signOutWithRedirect}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}; 