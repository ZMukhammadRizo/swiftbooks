// Role-Based Access Control (RBAC) Library
// Defines permissions, roles, and access control utilities for SwiftBooks

export type UserRole = 'client' | 'user' | 'accountant' | 'admin';
export type Permission = 'create' | 'read' | 'update' | 'delete' | '*';
export type Resource = 
  | 'financial_data'
  | 'transactions' 
  | 'reports'
  | 'documents'
  | 'meetings'
  | 'billing'
  | 'clients'
  | 'businesses'
  | 'users'
  | 'system'
  | 'analytics'
  | '*';

// Core permission interface
export interface RolePermissions {
  [resource: string]: Permission[];
}

// Comprehensive role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  client: {
    // Client can manage their own financial data
    financial_data: ['read'],
    transactions: ['create', 'read'],
    reports: ['read'],
    documents: ['create', 'read', 'update', 'delete'],
    meetings: ['create', 'read', 'update'],
    billing: ['read', 'update'], // Can view and update their own billing
    businesses: ['read', 'update'], // Can view and update their own businesses
    analytics: ['read'], // Can view their own analytics
  },
  accountant: {
    // Accountant can manage client data and provide services
    financial_data: ['read', 'update'],
    transactions: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'update', 'delete'],
    documents: ['read', 'update'], // Can review and update client documents
    meetings: ['create', 'read', 'update', 'delete'],
    billing: ['read'], // Can view client billing for context
    clients: ['read', 'update'], // Can manage client relationships
    businesses: ['read', 'update'], // Can view and help manage client businesses
    analytics: ['read'], // Can view client analytics
  },
  admin: {
    // Admin has full system access
    '*': ['*'], // All permissions on all resources
    users: ['create', 'read', 'update', 'delete'],
    businesses: ['create', 'read', 'update', 'delete'],
    system: ['create', 'read', 'update', 'delete'],
    analytics: ['read', 'update'],
    billing: ['create', 'read', 'update', 'delete'],
  }
};

// Business role permissions (within a specific business context)
export const BUSINESS_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    '*': ['*'], // Business owner has full control of their business
  },
  manager: {
    financial_data: ['read', 'update'],
    transactions: ['create', 'read', 'update'],
    reports: ['read', 'update'],
    documents: ['create', 'read', 'update'],
    meetings: ['create', 'read', 'update'],
    analytics: ['read'],
  },
  employee: {
    financial_data: ['read'],
    transactions: ['create', 'read'],
    documents: ['create', 'read'],
    meetings: ['read'],
    reports: ['read'],
  },
  viewer: {
    financial_data: ['read'],
    transactions: ['read'],
    documents: ['read'],
    reports: ['read'],
    analytics: ['read'],
  }
};

// Feature flags based on subscription tiers
export const SUBSCRIPTION_FEATURES: Record<string, string[]> = {
  free: [
    'basic_dashboard',
    'basic_transactions',
    'basic_reports',
  ],
  basic: [
    'basic_dashboard',
    'basic_transactions', 
    'basic_reports',
    'document_upload',
    'meeting_scheduling',
  ],
  premium: [
    'basic_dashboard',
    'basic_transactions',
    'basic_reports', 
    'document_upload',
    'meeting_scheduling',
    'advanced_analytics',
    'ai_insights',
    'custom_reports',
  ],
  enterprise: [
    'basic_dashboard',
    'basic_transactions',
    'basic_reports',
    'document_upload', 
    'meeting_scheduling',
    'advanced_analytics',
    'ai_insights',
    'custom_reports',
    'priority_support',
    'api_access',
    'white_labeling',
    'advanced_integrations',
  ]
};

// Utility functions for permission checking
export class RBACUtils {
  /**
   * Check if a user role has permission for a specific action on a resource
   */
  static hasRolePermission(
    userRole: UserRole, 
    resource: Resource, 
    action: Permission
  ): boolean {
    const rolePerms = ROLE_PERMISSIONS[userRole];
    
    // Check if admin has all permissions
    if (rolePerms['*']?.includes('*')) {
      return true;
    }
    
    // Check specific resource permissions
    const resourcePerms = rolePerms[resource] || [];
    
    return resourcePerms.includes(action) || resourcePerms.includes('*');
  }

  /**
   * Check if a business role has permission for a specific action on a resource
   */
  static hasBusinessRolePermission(
    businessRole: string,
    resource: Resource,
    action: Permission
  ): boolean {
    const rolePerms = BUSINESS_ROLE_PERMISSIONS[businessRole] || {};
    
    // Check wildcard permissions
    if (rolePerms['*']?.includes('*')) {
      return true;
    }
    
    // Check specific resource permissions
    const resourcePerms = rolePerms[resource] || [];
    
    return resourcePerms.includes(action) || resourcePerms.includes('*');
  }

  /**
   * Check if user owns the resource (for data filtering)
   */
  static isResourceOwner(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  /**
   * Check if user belongs to the same business as the resource
   */
  static isInSameBusiness(
    userBusinesses: string[], 
    resourceBusinessId: string
  ): boolean {
    return userBusinesses.includes(resourceBusinessId);
  }

  /**
   * Check subscription feature access
   */
  static hasSubscriptionFeature(
    subscription: string, 
    feature: string
  ): boolean {
    const features = SUBSCRIPTION_FEATURES[subscription] || SUBSCRIPTION_FEATURES.free;
    return features.includes(feature);
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(userRole: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[userRole] || {};
  }

  /**
   * Get allowed actions for a role on a specific resource
   */
  static getAllowedActions(
    userRole: UserRole, 
    resource: Resource
  ): Permission[] {
    const rolePerms = ROLE_PERMISSIONS[userRole];
    
    if (rolePerms['*']?.includes('*')) {
      return ['create', 'read', 'update', 'delete'];
    }
    
    return rolePerms[resource] || [];
  }

  /**
   * Check if user can access admin features
   */
  static isAdmin(userRole: UserRole): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user can access accountant features
   */
  static isAccountant(userRole: UserRole): boolean {
    return userRole === 'accountant' || userRole === 'admin';
  }

  /**
   * Check if user is a client
   */
  static isClient(userRole: UserRole): boolean {
    return userRole === 'client';
  }

  /**
   * Generate a permission key for caching
   */
  static getPermissionKey(
    userRole: UserRole,
    resource: Resource,
    action: Permission,
    businessRole?: string
  ): string {
    return `${userRole}:${resource}:${action}${businessRole ? `:${businessRole}` : ''}`;
  }
}

// Permission context for complex scenarios
export interface PermissionContext {
  userRole: UserRole;
  businessRole?: string;
  isOwner: boolean;
  businessId?: string;
  subscription?: string;
  userBusinesses: string[];
}

/**
 * Comprehensive permission checker with context
 */
export function checkPermission(
  context: PermissionContext,
  resource: Resource,
  action: Permission,
  resourceData?: {
    ownerId?: string;
    businessId?: string;
  }
): boolean {
  const { userRole, businessRole, isOwner, subscription } = context;

  // Admin always has access
  if (RBACUtils.isAdmin(userRole)) {
    return true;
  }

  // Check if user owns the resource
  if (resourceData?.ownerId && isOwner && resourceData.ownerId === context.userBusinesses[0]) {
    return true;
  }

  // Check business-level permissions if business role exists
  if (businessRole && resourceData?.businessId) {
    if (RBACUtils.isInSameBusiness(context.userBusinesses, resourceData.businessId)) {
      if (RBACUtils.hasBusinessRolePermission(businessRole, resource, action)) {
        return true;
      }
    }
  }

  // Check role-based permissions
  if (RBACUtils.hasRolePermission(userRole, resource, action)) {
    return true;
  }

  return false;
}

// Export commonly used permission sets for convenience
export const PERMISSIONS = {
  READ_ONLY: ['read'] as Permission[],
  READ_WRITE: ['read', 'create', 'update'] as Permission[],
  FULL_ACCESS: ['create', 'read', 'update', 'delete'] as Permission[],
  ADMIN_ONLY: ['*'] as Permission[],
} as const;

// Export resource constants
export const RESOURCES = {
  FINANCIAL_DATA: 'financial_data' as Resource,
  TRANSACTIONS: 'transactions' as Resource,
  REPORTS: 'reports' as Resource,
  DOCUMENTS: 'documents' as Resource,
  MEETINGS: 'meetings' as Resource,
  BILLING: 'billing' as Resource,
  CLIENTS: 'clients' as Resource,
  BUSINESSES: 'businesses' as Resource,
  USERS: 'users' as Resource,
  SYSTEM: 'system' as Resource,
  ANALYTICS: 'analytics' as Resource,
} as const;

// Export action constants
export const ACTIONS = {
  CREATE: 'create' as Permission,
  READ: 'read' as Permission,
  UPDATE: 'update' as Permission,
  DELETE: 'delete' as Permission,
  ALL: '*' as Permission,
} as const; 