import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { 
  Building, 
  ChevronDown, 
  Plus, 
  Check,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

interface BusinessSelectorProps {
  variant?: 'header' | 'sidebar' | 'compact';
  showAddBusiness?: boolean;
  onAddBusiness?: () => void;
  className?: string;
}

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  variant = 'header',
  showAddBusiness = false,
  onAddBusiness,
  className = ''
}) => {
  const { user, currentBusiness, switchBusiness } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  // Get all businesses available to the user
  const businesses = user.businesses || [];
  const hasMultipleBusinesses = businesses.length > 1;

  // Helper functions
  const getBusinessStatus = (business: any) => {
    // For user's own businesses, check the business status
    if (business.business) {
      return business.business.status || 'active';
    }
    // Fallback for direct business objects
    return business.status || 'active';
  };

  const getBusinessName = (business: any) => {
    if (business.business) {
      return business.business.name;
    }
    return business.name || 'Unknown Business';
  };

  const getBusinessId = (business: any) => {
    if (business.business) {
      return business.business.id;
    }
    return business.id;
  };

  const getCurrentBusinessDisplay = () => {
    if (!currentBusiness) {
      return {
        name: 'No Business Selected',
        status: 'inactive',
        isPlaceholder: true
      };
    }

    return {
      name: currentBusiness.name || 'Current Business',
      status: currentBusiness.status || 'active',
      isPlaceholder: false
    };
  };

  const currentDisplay = getCurrentBusinessDisplay();

  // Compact variant for space-constrained areas
  if (variant === 'compact') {
    if (!hasMultipleBusinesses) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Building className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 truncate max-w-32">
            {currentDisplay.name}
          </span>
        </div>
      );
    }

    return (
      <Select 
        value={currentBusiness?.id || ''} 
        onValueChange={switchBusiness}
      >
        <SelectTrigger className={`w-auto min-w-36 ${className}`}>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <SelectValue placeholder="Select business" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={getBusinessId(business)} value={getBusinessId(business)}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{getBusinessName(business)}</span>
                <Badge 
                  variant={getBusinessStatus(business) === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {getBusinessStatus(business)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Header variant - full featured business selector
  if (variant === 'header') {
    return (
      <div className={`flex items-center ${className}`}>
        {/* Current Business Display */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 leading-tight">
                {currentDisplay.name}
              </span>
              {!currentDisplay.isPlaceholder && (
                <span className="text-xs text-gray-500">
                  {businesses.length} business{businesses.length !== 1 ? 'es' : ''} available
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {!currentDisplay.isPlaceholder && (
            <Badge 
              variant={currentDisplay.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {currentDisplay.status}
            </Badge>
          )}

          {/* Business Switcher */}
          {hasMultipleBusinesses && (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Switch Business Context
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {businesses.map((business) => {
                  const businessId = getBusinessId(business);
                  const businessName = getBusinessName(business);
                  const businessStatus = getBusinessStatus(business);
                  const isActive = currentBusiness?.id === businessId;

                  return (
                    <DropdownMenuItem
                      key={businessId}
                      onClick={() => {
                        switchBusiness(businessId);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{businessName}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge 
                                variant={businessStatus === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {businessStatus}
                              </Badge>
                              {business.role && (
                                <span>• {business.role}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}

                {showAddBusiness && onAddBusiness && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onAddBusiness} className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="font-medium">Add New Business</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Quick Actions */}
        {!currentDisplay.isPlaceholder && hasMultipleBusinesses && (
          <div className="ml-3 text-xs text-gray-500">
            {businesses.length} available
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant - detailed business card
  if (variant === 'sidebar') {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Current Business</span>
          </div>
          {!currentDisplay.isPlaceholder && (
            <Badge 
              variant={currentDisplay.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {currentDisplay.status}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 truncate">
              {currentDisplay.name}
            </h3>
            {!currentDisplay.isPlaceholder && (
              <p className="text-sm text-gray-500">
                You have access to {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
              </p>
            )}
          </div>

          {currentDisplay.isPlaceholder && (
            <p className="text-sm text-gray-500">
              No business selected. Please contact your administrator.
            </p>
          )}

          {hasMultipleBusinesses && (
            <Select 
              value={currentBusiness?.id || ''} 
              onValueChange={switchBusiness}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Switch business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={getBusinessId(business)} value={getBusinessId(business)}>
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">{getBusinessName(business)}</span>
                      <Badge 
                        variant={getBusinessStatus(business) === 'active' ? 'default' : 'secondary'}
                        className="text-xs ml-auto"
                      >
                        {getBusinessStatus(business)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showAddBusiness && onAddBusiness && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddBusiness}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}; 