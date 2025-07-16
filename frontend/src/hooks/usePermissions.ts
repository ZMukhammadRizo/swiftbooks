import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  RBACUtils, 
  checkPermission, 
  type Resource, 
  type Permission, 
  type UserRole,
  type PermissionContext,
  RESOURCES,
  ACTIONS,
} from '@/lib/rbac';

/**
 * Hook for checking permissions
 */
export function usePermissions() {
  const { user, currentBusiness } = useAuth();

  // Memoize permission context to avoid recalculation
  const permissionContext = useMemo((): PermissionContext | null => {
    if (!user) return null;

    return {
      userRole: user.role as UserRole,
      businessRole: 'owner', // Would be determined from user-business relationship
      isOwner: currentBusiness?.owner_id === user.id,
      businessId: currentBusiness?.id,
      subscription: 'premium', // Would come from user/business subscription data
      userBusinesses: user.businesses?.map(b => b.business_id) || [],
    };
  }, [user, currentBusiness]);

  /**
   * Check if user has permission for a specific action on a resource
   */
  const hasPermission = (
    resource: Resource, 
    action: Permission,
    resourceData?: {
      ownerId?: string;
      businessId?: string;
    }
  ): boolean => {
    if (!permissionContext) return false;
    return checkPermission(permissionContext, resource, action, resourceData);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  /**
   * Check if user has access to a subscription feature
   */
  const hasFeature = (feature: string): boolean => {
    if (!permissionContext) return false;
    return RBACUtils.hasSubscriptionFeature(
      permissionContext.subscription || 'free', 
      feature
    );
  };

  /**
   * Get all allowed actions for a resource
   */
  const getAllowedActions = (resource: Resource): Permission[] => {
    if (!user) return [];
    return RBACUtils.getAllowedActions(user.role as UserRole, resource);
  };

  /**
   * Check multiple permissions at once
   */
  const hasPermissions = (
    permissions: Array<{ resource: Resource; action: Permission; resourceData?: any }>
  ): boolean => {
    return permissions.every(({ resource, action, resourceData }) => 
      hasPermission(resource, action, resourceData)
    );
  };

  /**
   * Get permission details for debugging
   */
  const getPermissionDetails = (resource: Resource, action: Permission) => {
    if (!user || !permissionContext) {
      return {
        hasPermission: false,
        reason: 'No user or permission context',
        userRole: null,
        resourcePermissions: [],
      };
    }

    const userRole = user.role as UserRole;
    const resourcePermissions = RBACUtils.getAllowedActions(userRole, resource);
    const hasAccess = hasPermission(resource, action);

    return {
      hasPermission: hasAccess,
      reason: hasAccess ? 'Permission granted' : 'Permission denied',
      userRole,
      resourcePermissions,
      isAdmin: RBACUtils.isAdmin(userRole),
      isAccountant: RBACUtils.isAccountant(userRole),
      isClient: RBACUtils.isClient(userRole),
    };
  };

  return {
    hasPermission,
    hasRole,
    hasFeature,
    getAllowedActions,
    hasPermissions,
    getPermissionDetails,
    isAuthenticated: !!user,
    isAdmin: user ? RBACUtils.isAdmin(user.role as UserRole) : false,
    isAccountant: user ? RBACUtils.isAccountant(user.role as UserRole) : false,
    isClient: user ? RBACUtils.isClient(user.role as UserRole) : false,
    userRole: user?.role as UserRole | undefined,
    permissionContext,
  };
}

/**
 * Hook for role-specific checks
 */
export function useRole() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  return {
    isAdmin: userRole ? RBACUtils.isAdmin(userRole) : false,
    isAccountant: userRole ? RBACUtils.isAccountant(userRole) : false,
    isClient: userRole ? RBACUtils.isClient(userRole) : false,
    role: userRole,
    hasRole: (roles: UserRole[]) => userRole ? roles.includes(userRole) : false,
  };
}

/**
 * Hook for business context permissions
 */
export function useBusinessPermissions(businessId?: string) {
  const { user, currentBusiness } = useAuth();
  const targetBusiness = businessId || currentBusiness?.id;

  const isOwner = useMemo(() => {
    if (!user || !targetBusiness) return false;
    // User owns the business if it's in their businesses list (since we only load owned businesses)
    return user.businesses?.some(b => b.id === targetBusiness) || false;
  }, [user, targetBusiness]);

  const businessRole = useMemo(() => {
    if (!user || !targetBusiness) return null;
    const userBusiness = user.businesses?.find(b => b.id === targetBusiness);
    // For owned businesses, the user role is the business role
    return userBusiness ? user.role : null;
  }, [user, targetBusiness]);

  const hasBusinessAccess = useMemo(() => {
    if (!user || !targetBusiness) return false;
    return user.businesses?.some(b => b.id === targetBusiness) || false;
  }, [user, targetBusiness]);

  return {
    isOwner,
    businessRole,
    hasBusinessAccess,
    businessId: targetBusiness,
  };
}

/**
 * Hook for subscription and feature access
 */
export function useSubscription() {
  const { user, currentBusiness } = useAuth();
  
  // This would be enhanced to get actual subscription data
  const subscription = 'premium'; // Placeholder
  
  const hasFeature = (feature: string): boolean => {
    return RBACUtils.hasSubscriptionFeature(subscription, feature);
  };

  const getSubscriptionFeatures = (): string[] => {
    return RBACUtils.hasSubscriptionFeature(subscription, 'basic_dashboard') 
      ? ['basic_dashboard', 'basic_transactions', 'basic_reports'] 
      : [];
  };

  return {
    subscription,
    hasFeature,
    getSubscriptionFeatures,
    isPremium: subscription === 'premium' || subscription === 'enterprise',
    isEnterprise: subscription === 'enterprise',
  };
}

/**
 * Hook for specific resource permissions
 */
export function useResourcePermissions(resource: Resource) {
  const { hasPermission, getAllowedActions, userRole } = usePermissions();

  const canCreate = hasPermission(resource, ACTIONS.CREATE);
  const canRead = hasPermission(resource, ACTIONS.READ);
  const canUpdate = hasPermission(resource, ACTIONS.UPDATE);
  const canDelete = hasPermission(resource, ACTIONS.DELETE);
  const hasFullAccess = canCreate && canRead && canUpdate && canDelete;

  const allowedActions = getAllowedActions(resource);

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    hasFullAccess,
    allowedActions,
    hasAnyAccess: allowedActions.length > 0,
    resourcePermissions: {
      [ACTIONS.CREATE]: canCreate,
      [ACTIONS.READ]: canRead,
      [ACTIONS.UPDATE]: canUpdate,
      [ACTIONS.DELETE]: canDelete,
    },
  };
}

/**
 * Convenience hooks for common resources
 */
export const useTransactionPermissions = () => useResourcePermissions(RESOURCES.TRANSACTIONS);
export const useReportPermissions = () => useResourcePermissions(RESOURCES.REPORTS);
export const useDocumentPermissions = () => useResourcePermissions(RESOURCES.DOCUMENTS);
export const useMeetingPermissions = () => useResourcePermissions(RESOURCES.MEETINGS);
export const useFinancialDataPermissions = () => useResourcePermissions(RESOURCES.FINANCIAL_DATA);
export const useBusinessPermissions = () => useResourcePermissions(RESOURCES.BUSINESSES);
export const useUserPermissions = () => useResourcePermissions(RESOURCES.USERS);
export const useSystemPermissions = () => useResourcePermissions(RESOURCES.SYSTEM);

/**
 * Hook for conditional rendering based on permissions
 */
export function useConditionalRender() {
  const { hasPermission, hasRole, hasFeature } = usePermissions();

  const renderIf = {
    hasPermission: (resource: Resource, action: Permission, children: React.ReactNode) =>
      hasPermission(resource, action) ? children : null,
    
    hasRole: (roles: UserRole[], children: React.ReactNode) =>
      hasRole(roles) ? children : null,
      
    hasFeature: (feature: string, children: React.ReactNode) =>
      hasFeature(feature) ? children : null,
      
    isAdmin: (children: React.ReactNode) =>
      hasRole(['admin']) ? children : null,
      
    isAccountant: (children: React.ReactNode) =>
      hasRole(['accountant', 'admin']) ? children : null,
      
    isClient: (children: React.ReactNode) =>
      hasRole(['client']) ? children : null,
  };

  return renderIf;
}

/**
 * Hook for navigation permissions
 */
export function useNavigationPermissions() {
  const { hasRole, hasPermission } = usePermissions();

  const canAccessRoute = (route: string): boolean => {
    switch (route) {
      case '/admin':
        return hasRole(['admin']);
      case '/accountant':
        return hasRole(['accountant', 'admin']);
      case '/client':
        return hasRole(['client']);
      case '/users':
        return hasPermission(RESOURCES.USERS, ACTIONS.READ);
      case '/businesses':
        return hasPermission(RESOURCES.BUSINESSES, ACTIONS.READ);
      case '/system':
        return hasPermission(RESOURCES.SYSTEM, ACTIONS.READ);
      default:
        return true; // Allow access to public routes
    }
  };

  const getAccessibleRoutes = (): string[] => {
    const routes = ['/dashboard'];
    
    if (hasRole(['admin'])) {
      routes.push('/admin', '/users', '/businesses', '/system');
    }
    
    if (hasRole(['accountant', 'admin'])) {
      routes.push('/accountant', '/clients');
    }
    
    if (hasRole(['client'])) {
      routes.push('/client');
    }

    return routes;
  };

  return {
    canAccessRoute,
    getAccessibleRoutes,
  };
}

// Export commonly used permission combinations
export const useCommonPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canManageFinances: hasPermission(RESOURCES.FINANCIAL_DATA, ACTIONS.UPDATE),
    canViewReports: hasPermission(RESOURCES.REPORTS, ACTIONS.READ),
    canCreateReports: hasPermission(RESOURCES.REPORTS, ACTIONS.CREATE),
    canManageDocuments: hasPermission(RESOURCES.DOCUMENTS, ACTIONS.CREATE),
    canScheduleMeetings: hasPermission(RESOURCES.MEETINGS, ACTIONS.CREATE),
    canViewClients: hasPermission(RESOURCES.CLIENTS, ACTIONS.READ),
    canManageUsers: hasPermission(RESOURCES.USERS, ACTIONS.UPDATE),
    canAccessSystem: hasPermission(RESOURCES.SYSTEM, ACTIONS.READ),
  };
}; 