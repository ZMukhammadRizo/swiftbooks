// User and Authentication Types
export type UserRole = 'client' | 'user' | 'accountant' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface AuthUser extends User {
  businesses: Business[];
}

export interface UserBusiness {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  permissions: Permission[];
  created_at: string;
  business: Business;
}

export interface Business {
  id: string;
  name: string;
  owner_id: string;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  type?: string | null;
  monthly_fee?: number | null;
  settings?: string | null;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  scope: 'own' | 'assigned' | 'all';
}

// Financial Data Types
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type ReportType = 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary';
export type ReportStatus = 'draft' | 'pending_review' | 'approved' | 'published';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

export interface Transaction {
  id: string;
  business_id: string;
  amount: number;
  description?: string;
  category?: string;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  amount: number;
  description?: string;
  category?: string;
  date: string;
  type: TransactionType;
}

export interface UpdateTransactionRequest {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

export interface Report {
  id: string;
  business_id: string;
  type: ReportType;
  title: string;
  data: Record<string, any>;
  status: ReportStatus;
  period_start?: string;
  period_end?: string;
  generated_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  type: ReportType;
  title: string;
  period_start?: string;
  period_end?: string;
}

export interface Document {
  id: string;
  business_id: string;
  uploaded_by: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UploadDocumentRequest {
  file: File;
  category?: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  stripe_subscription_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BusinessMetrics {
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  transaction_count: number;
  pending_transactions: number;
  monthly_growth?: number;
}

export interface DashboardData {
  metrics: BusinessMetrics;
  recent_transactions: Transaction[];
  pending_reports: Report[];
  upcoming_meetings: Meeting[];
}

export interface Meeting {
  id: string;
  business_id: string;
  client_id: string;
  accountant_id: string;
  title: string;
  description?: string;
  scheduled_for: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'canceled';
  meeting_link?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationInfo;
}

// Auth Context Types
export interface AuthContext {
  user: AuthUser | null;
  currentBusiness: Business | null;
  loading: boolean;
  authenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, businessName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchBusiness: (businessId: string) => void;
  hasPermission: (resource: string, action: string) => boolean;
  refreshUserData?: () => Promise<void>;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  businessName?: string;
}

export interface TransactionForm {
  amount: string;
  description: string;
  category: string;
  date: string;
  type: TransactionType;
}

// UI Component Types
export interface NavItem {
  title: string;
  href: string;
  icon?: any;
  role?: UserRole[];
  children?: NavItem[];
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
}

// Constants
export const USER_ROLES = {
  CLIENT: 'client' as const,
  ACCOUNTANT: 'accountant' as const,
  ADMIN: 'admin' as const,
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income' as const,
  EXPENSE: 'expense' as const,
  TRANSFER: 'transfer' as const,
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

export const REPORT_TYPES = {
  PROFIT_LOSS: 'profit_loss' as const,
  BALANCE_SHEET: 'balance_sheet' as const,
  CASH_FLOW: 'cash_flow' as const,
  TAX_SUMMARY: 'tax_summary' as const,
} as const;

// Utility Functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}; 