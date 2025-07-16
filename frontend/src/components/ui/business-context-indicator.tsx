import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { 
  Building, 
  Plus, 
  AlertTriangle, 
  Info,
  Users,
  DollarSign,
  Activity,
  Calendar
} from 'lucide-react';

interface BusinessContextIndicatorProps {
  variant?: 'full' | 'minimal' | 'alert';
  showActions?: boolean;
  onAddBusiness?: () => void;
  className?: string;
}

export const BusinessContextIndicator: React.FC<BusinessContextIndicatorProps> = ({
  variant = 'full',
  showActions = true,
  onAddBusiness,
  className = ''
}) => {
  const { user, currentBusiness } = useAuth();

  if (!user) return null;

  const businesses = user.businesses || [];
  const hasBusinesses = businesses.length > 0;
  const hasCurrentBusiness = !!currentBusiness;

  // No businesses scenario
  if (!hasBusinesses) {
    if (variant === 'alert') {
      return (
        <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <span>No businesses found. Add your first business to get started.</span>
              {showActions && onAddBusiness && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onAddBusiness}
                  className="ml-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Business
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (variant === 'minimal') {
      return (
        <div className={`flex items-center gap-2 text-amber-700 ${className}`}>
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">No business selected</span>
          {showActions && onAddBusiness && (
            <Button size="sm" variant="outline" onClick={onAddBusiness}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      );
    }

    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-900">No Business Found</CardTitle>
              <CardDescription className="text-amber-700">
                Add your first business to start managing finances
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-amber-800">
              Create a business profile to:
            </p>
            <ul className="text-sm text-amber-800 space-y-1 ml-4">
              <li>• Track financial transactions</li>
              <li>• Generate reports</li>
              <li>• Manage business documents</li>
              <li>• Access AI financial insights</li>
            </ul>
            {showActions && onAddBusiness && (
              <Button 
                onClick={onAddBusiness}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Business
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has businesses but none selected
  if (!hasCurrentBusiness) {
    if (variant === 'alert') {
      return (
        <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have {businesses.length} business{businesses.length !== 1 ? 'es' : ''} available. 
            Please select one to continue.
          </AlertDescription>
        </Alert>
      );
    }

    if (variant === 'minimal') {
      return (
        <div className={`flex items-center gap-2 text-blue-700 ${className}`}>
          <Info className="h-4 w-4" />
          <span className="text-sm">Please select a business</span>
        </div>
      );
    }

    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Select Business</CardTitle>
              <CardDescription className="text-blue-700">
                Choose from {businesses.length} available business{businesses.length !== 1 ? 'es' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Current business selected - show context info
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (variant === 'alert') {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <Building className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              Working in: <strong>{currentBusiness.name}</strong>
              <Badge className={`ml-2 text-xs ${getStatusColor(currentBusiness.status || 'active')}`}>
                {currentBusiness.status || 'active'}
              </Badge>
            </div>
            {businesses.length > 1 && (
              <span className="text-xs">
                {businesses.length - 1} other{businesses.length !== 2 ? 's' : ''} available
              </span>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-gray-900 truncate max-w-32">
          {currentBusiness.name}
        </span>
        <Badge className={`text-xs ${getStatusColor(currentBusiness.status || 'active')}`}>
          {currentBusiness.status || 'active'}
        </Badge>
      </div>
    );
  }

  // Full business context display
  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-900">{currentBusiness.name}</CardTitle>
              <CardDescription className="text-green-700">
                Current business context
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(currentBusiness.status || 'active')}>
            {currentBusiness.status || 'active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-800">
              <Calendar className="h-3 w-3" />
              <span>
                Since {new Date(currentBusiness.created_at || '').toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-green-800">
              <Users className="h-3 w-3" />
              <span>{businesses.length} business{businesses.length !== 1 ? 'es' : ''}</span>
            </div>
          </div>
          
          {businesses.length > 1 && (
            <div className="pt-2 border-t border-green-200">
              <p className="text-xs text-green-700">
                You have access to {businesses.length - 1} other business{businesses.length !== 2 ? 'es' : ''}. 
                Use the business selector to switch context.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for pages that need business context
export const RequireBusinessContext: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAddBusiness?: () => void;
}> = ({ children, fallback, onAddBusiness }) => {
  const { user, currentBusiness } = useAuth();

  if (!user) return null;

  const hasBusinesses = (user.businesses || []).length > 0;
  const hasCurrentBusiness = !!currentBusiness;

  if (!hasBusinesses || !hasCurrentBusiness) {
    return fallback || (
      <div className="flex items-center justify-center min-h-96">
        <BusinessContextIndicator 
          variant="full" 
          onAddBusiness={onAddBusiness}
          className="max-w-md"
        />
      </div>
    );
  }

  return <>{children}</>;
}; 