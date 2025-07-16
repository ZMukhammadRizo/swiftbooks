import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RBACUtils, checkPermission, type Resource, type Permission, type UserRole } from '@/lib/rbac';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

// Props for permission guard components
interface PermissionGuardProps {
  children: React.ReactNode;
  resource: Resource;
  action: Permission;
  businessRole?: string;
  resourceData?: {
    ownerId?: string;
    businessId?: string;
  };
  fallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: string;
  subscription?: string;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Permission Guard Component
 * Protects UI elements based on specific resource and action permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  businessRole,
  resourceData,
  fallback,
  showError = true,
  errorMessage,
}) => {
  const { user, currentBusiness } = useAuth();

  if (!user) {
    return showError ? (
      <AccessDeniedFallback 
        reason="authentication"
        message="Please log in to access this feature"
      />
    ) : fallback || null;
  }

  // Build permission context
  const context = {
    userRole: user.role as UserRole,
    businessRole: businessRole || 'owner', // Default to owner if not specified
    isOwner: currentBusiness?.owner_id === user.id,
    businessId: currentBusiness?.id,
    subscription: 'premium', // Would come from user/business data
    userBusinesses: user.businesses?.map(b => b.business_id) || [],
  };

  const hasPermission = checkPermission(context, resource, action, resourceData);

  if (!hasPermission) {
    if (showError) {
      return (
        <AccessDeniedFallback 
          reason="permission"
          message={errorMessage || `You don't have permission to ${action} ${resource}`}
          resource={resource}
          action={action}
        />
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * Role Guard Component
 * Protects UI elements based on user roles
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showError = true,
  errorMessage,
}) => {
  const { user } = useAuth();

  if (!user) {
    return showError ? (
      <AccessDeniedFallback 
        reason="authentication"
        message="Please log in to access this feature"
      />
    ) : fallback || null;
  }

  const hasRole = allowedRoles.includes(user.role as UserRole);

  if (!hasRole) {
    if (showError) {
      return (
        <AccessDeniedFallback 
          reason="role"
          message={errorMessage || `This feature requires one of these roles: ${allowedRoles.join(', ')}`}
          allowedRoles={allowedRoles}
        />
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * Feature Guard Component
 * Protects UI elements based on subscription features
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  feature,
  subscription = 'free',
  fallback,
  showError = true,
}) => {
  const hasFeature = RBACUtils.hasSubscriptionFeature(subscription, feature);

  if (!hasFeature) {
    if (showError) {
      return (
        <SubscriptionRequiredFallback 
          feature={feature}
          currentSubscription={subscription}
        />
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * Admin Only Guard Component
 * Simple guard for admin-only features
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}> = ({ children, fallback, showError = true }) => {
  return (
    <RoleGuard
      allowedRoles={['admin']}
      fallback={fallback}
      showError={showError}
      errorMessage="This feature is only available to administrators"
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Accountant or Admin Guard Component
 * For features that accountants and admins can access
 */
export const AccountantGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}> = ({ children, fallback, showError = true }) => {
  return (
    <RoleGuard
      allowedRoles={['accountant', 'admin']}
      fallback={fallback}
      showError={showError}
      errorMessage="This feature is only available to accountants and administrators"
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Access Denied Fallback Component
 */
const AccessDeniedFallback: React.FC<{
  reason: 'authentication' | 'permission' | 'role';
  message: string;
  resource?: Resource;
  action?: Permission;
  allowedRoles?: UserRole[];
}> = ({ reason, message, resource, action, allowedRoles }) => {
  const getIcon = () => {
    switch (reason) {
      case 'authentication':
        return <Lock className="h-5 w-5 text-blue-600" />;
      case 'permission':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'role':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getVariant = () => {
    switch (reason) {
      case 'authentication':
        return 'default';
      case 'permission':
        return 'destructive';
      case 'role':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant() as any} className="border-dashed">
      {getIcon()}
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Access Restricted</p>
          <p className="text-sm">{message}</p>
          {reason === 'authentication' && (
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/login'}
              className="mt-2"
            >
              Login
            </Button>
          )}
          {reason === 'role' && allowedRoles && (
            <p className="text-xs text-muted-foreground">
              Required roles: {allowedRoles.join(', ')}
            </p>
          )}
          {reason === 'permission' && resource && action && (
            <p className="text-xs text-muted-foreground">
              Required permission: {action} on {resource}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Subscription Required Fallback Component
 */
const SubscriptionRequiredFallback: React.FC<{
  feature: string;
  currentSubscription: string;
}> = ({ feature, currentSubscription }) => {
  return (
    <Alert className="border-dashed border-purple-200 bg-purple-50">
      <Shield className="h-5 w-5 text-purple-600" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium text-purple-900">Premium Feature</p>
          <p className="text-sm text-purple-800">
            The "{feature}" feature requires a higher subscription tier.
          </p>
          <p className="text-xs text-purple-600">
            Current plan: {currentSubscription}
          </p>
          <Button 
            size="sm" 
            className="mt-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              // Navigate to subscription upgrade page
              console.log('Navigate to subscription upgrade');
            }}
          >
            Upgrade Plan
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Conditional Render Component
 * Render children only if permission check passes, no fallback shown
 */
export const ConditionalRender: React.FC<{
  children: React.ReactNode;
  condition: boolean;
}> = ({ children, condition }) => {
  return condition ? <>{children}</> : null;
};

/**
 * Permission-based Button Component
 * Button that disables/hides based on permissions
 */
export const PermissionButton: React.FC<{
  children: React.ReactNode;
  resource: Resource;
  action: Permission;
  onClick?: () => void;
  className?: string;
  variant?: any;
  size?: any;
  disabled?: boolean;
  hideIfNoPermission?: boolean;
}> = ({ 
  children, 
  resource, 
  action, 
  onClick, 
  className,
  variant,
  size,
  disabled = false,
  hideIfNoPermission = false,
  ...props 
}) => {
  const { user, currentBusiness } = useAuth();

  if (!user) {
    return hideIfNoPermission ? null : (
      <Button disabled className={className} variant={variant} size={size} {...props}>
        {children}
      </Button>
    );
  }

  const context = {
    userRole: user.role as UserRole,
    businessRole: 'owner',
    isOwner: currentBusiness?.owner_id === user.id,
    businessId: currentBusiness?.id,
    subscription: 'premium',
    userBusinesses: user.businesses?.map(b => b.business_id) || [],
  };

  const hasPermission = checkPermission(context, resource, action);

  if (!hasPermission && hideIfNoPermission) {
    return null;
  }

  return (
    <Button
      onClick={hasPermission ? onClick : undefined}
      disabled={disabled || !hasPermission}
      className={className}
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
};

// Export all guards and utilities
export {
  AccessDeniedFallback,
  SubscriptionRequiredFallback,
};

// Export common guard combinations
export const Guards = {
  Permission: PermissionGuard,
  Role: RoleGuard,
  Feature: FeatureGuard,
  Admin: AdminGuard,
  Accountant: AccountantGuard,
  Conditional: ConditionalRender,
  Button: PermissionButton,
}; 