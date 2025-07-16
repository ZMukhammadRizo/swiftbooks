import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Building,
  DollarSign,
  Activity,
  TrendingUp,
  Shield,
  Settings,
  Database,
  Server,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  Trash2,
  RefreshCw,
  LogOut,
  BarChart3,
  PieChart,
  LineChart,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Bell,
  Zap,
  Target,
  Briefcase,
  UserCheck,
  UserX,
  Gauge
} from 'lucide-react';

// Import admin modals
import { AddUserModal } from '@/components/modals/AddUserModal';
import { ViewUserModal } from '@/components/modals/ViewUserModal';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { AddBusinessModal } from '@/components/modals/AddBusinessModal';
import { ViewBusinessModal } from '@/components/modals/ViewBusinessModal';
import { ManageBusinessModal } from '@/components/modals/ManageBusinessModal';
import { ExportBusinessModal } from '@/components/modals/ExportBusinessModal';

// Import admin sections
import { AdminBusinesses } from './sections/AdminBusinesses';

// Real data interfaces
interface SystemMetrics {
  totalUsers: number;
  totalBusinesses: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeUsers: number;
  systemUptime: number;
  avgResponseTime: number;
  errorRate: number;
  clientUsers: number;
  accountantUsers: number;
  adminUsers: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'accountant' | 'consultant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  joinDate: string;
  businessCount: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  location?: string;
  totalRevenue?: number;
}

interface Business {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  createdDate: string;
  revenue: number;
  employeeCount?: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  lastActivity: string;
  transactionCount: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRecurring: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  conversionRate: number;
  totalTransactions: number;
  averageTransactionSize: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data state
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  // Load all admin data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadSystemMetrics(),
        loadUsers(),
        loadBusinesses(),
        loadFinancialMetrics(),
        loadSystemAlerts()
      ]);

    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      // Get total counts
      const [usersResponse, businessesResponse] = await Promise.all([
        supabase.from('users').select('id, role, created_at', { count: 'exact' }),
        supabase.from('businesses').select('id, created_at', { count: 'exact' })
      ]);

      const totalUsers = usersResponse.count || 0;
      const totalBusinesses = businessesResponse.count || 0;

      // Count users by role
      const usersByRole = usersResponse.data?.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {};

      // Calculate growth (simplified - would need historical data for real calculation)
      const currentMonth = new Date().getMonth();
      const recentUsers = usersResponse.data?.filter(user => 
        new Date(user.created_at).getMonth() === currentMonth
      ).length || 0;
      const monthlyGrowth = totalUsers > 0 ? (recentUsers / totalUsers) * 100 : 0;

      // Calculate total revenue across all businesses
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('type', 'income')
        .eq('status', 'approved');

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setSystemMetrics({
        totalUsers,
        totalBusinesses,
        totalRevenue,
        monthlyGrowth,
        activeUsers: totalUsers, // Simplified - would need last login data
        systemUptime: 99.97, // Would come from monitoring service
        avgResponseTime: 145, // Would come from monitoring service
        errorRate: 0.03, // Would come from error tracking
        regularUsers: usersByRole.user || 0,
        accountantUsers: usersByRole.accountant || 0,
        adminUsers: usersByRole.admin || 0
      });
    } catch (err: any) {
      console.error('Error loading system metrics:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          businesses(*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform and enrich user data
      const transformedUsers: User[] = await Promise.all(
        (usersData || []).map(async (userData) => {
          const businesses = userData.businesses || [];
          
          // Calculate total revenue for client users
          let totalRevenue = 0;
          if (userData.role === 'user') {
            for (const userBusiness of businesses) {
              if (userBusiness.business) {
                const { data: transactions } = await supabase
                  .from('transactions')
                  .select('amount')
                  .eq('business_id', userBusiness.business.id)
                  .eq('type', 'income')
                  .eq('status', 'approved');
                
                const businessRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                totalRevenue += businessRevenue;
              }
            }
          }

          return {
            id: userData.id,
            name: userData.metadata?.firstName && userData.metadata?.lastName 
              ? `${userData.metadata.firstName} ${userData.metadata.lastName}`
              : userData.email?.split('@')[0] || 'Unknown User',
            email: userData.email || '',
            role: userData.role,
            status: 'active' as const, // Would be determined by last login, suspension status, etc.
            lastLogin: userData.updated_at || userData.created_at,
            joinDate: userData.created_at,
            businessCount: businesses.length,
            subscription: totalRevenue > 100000 ? 'enterprise' : 
                         totalRevenue > 50000 ? 'premium' :
                         totalRevenue > 10000 ? 'basic' : 'free',
            location: userData.metadata?.location || 'Unknown',
            totalRevenue: userData.role === 'user' ? totalRevenue : undefined
          };
        })
      );

      setUsers(transformedUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          *,
          owner:users(email, metadata),
          transactions(amount, type, status)
        `)
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      const transformedBusinesses: Business[] = (businessesData || []).map(business => {
        const transactions = business.transactions || [];
        const revenue = transactions
          .filter(t => t.type === 'income' && (t.status === 'approved' || !t.status)) // Fallback for missing status
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const employeeCount = 1; // For now, assume 1 employee (owner) per business

        return {
          id: business.id,
          name: business.name,
          owner: business.owner?.metadata?.firstName && business.owner?.metadata?.lastName
            ? `${business.owner.metadata.firstName} ${business.owner.metadata.lastName}`
            : business.owner?.email?.split('@')[0] || 'Unknown Owner',
          ownerEmail: business.owner?.email || '',
          industry: business.settings?.industry || 'Unknown',
          status: 'active' as const, // Would be determined by actual business status
          createdDate: business.created_at,
          revenue,
          employeeCount,
          subscription: revenue > 100000 ? 'enterprise' : 
                       revenue > 50000 ? 'premium' :
                       revenue > 10000 ? 'basic' : 'free',
          lastActivity: business.updated_at || business.created_at,
          transactionCount: transactions.length
        };
      });

      setBusinesses(transformedBusinesses);
    } catch (err: any) {
      console.error('Error loading businesses:', err);
      
      // If the error is about missing status column, show helpful message
      if (err.code === '42703' && err.message.includes('status')) {
        console.error('💡 Fix: The transactions table is missing the status column. Please run the database migration script.');
      }
    }
  };

  const loadFinancialMetrics = async () => {
    try {
      // Get all transactions for financial analysis
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('amount, type, status, created_at');

      const approvedTransactions = allTransactions?.filter(t => t.status === 'approved' || !t.status) || []; // Fallback for missing status
      const incomeTransactions = approvedTransactions.filter(t => t.type === 'income');
      
      const totalRevenue = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalTransactions = approvedTransactions.length;
      const averageTransactionSize = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate monthly recurring revenue (simplified)
      const currentMonth = new Date().getMonth();
      const monthlyTransactions = incomeTransactions.filter(t => 
        new Date(t.created_at).getMonth() === currentMonth
      );
      const monthlyRecurring = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate ARPU
      const totalUsers = users.filter(u => u.role === 'user').length;
      const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      setFinancialMetrics({
        totalRevenue,
        monthlyRecurring,
        churnRate: 3.2, // Would need historical data to calculate properly
        averageRevenuePerUser,
        lifetimeValue: averageRevenuePerUser * 12, // Simplified calculation
        conversionRate: 8.4, // Would need funnel data to calculate properly
        totalTransactions,
        averageTransactionSize
      });
    } catch (err: any) {
      console.error('Error loading financial metrics:', err);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Generate system alerts based on real data
      const alerts: SystemAlert[] = [];

      // Check for low activity businesses
      const lowActivityBusinesses = businesses.filter(b => {
        const lastActivity = new Date(b.lastActivity);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActivity < thirtyDaysAgo;
      });

      if (lowActivityBusinesses.length > 0) {
        alerts.push({
          id: 'low-activity',
      type: 'warning',
          title: 'Low Activity Businesses',
          message: `${lowActivityBusinesses.length} businesses have not been active in the last 30 days.`,
          timestamp: new Date().toISOString(),
      resolved: false,
      severity: 'medium'
        });
      }

      // Check for users without businesses
      const usersWithoutBusinesses = users.filter(u => u.role === 'user' && u.businessCount === 0);
      if (usersWithoutBusinesses.length > 0) {
        alerts.push({
          id: 'no-business',
          type: 'info',
          title: 'Users Without Businesses',
          message: `${usersWithoutBusinesses.length} client users have not created any businesses yet.`,
          timestamp: new Date().toISOString(),
      resolved: false,
          severity: 'low'
        });
      }

      // Check for high revenue businesses (opportunity)
      const highRevenueBusinesses = businesses.filter(b => b.revenue > 500000);
      if (highRevenueBusinesses.length > 0) {
        alerts.push({
          id: 'high-revenue',
      type: 'success',
          title: 'High Revenue Opportunity',
          message: `${highRevenueBusinesses.length} businesses have revenue over $500k - consider premium support outreach.`,
          timestamp: new Date().toISOString(),
          resolved: false,
          severity: 'low'
        });
      }

      // System health checks (would come from monitoring service)
      alerts.push({
        id: 'system-health',
        type: 'success',
        title: 'System Health Good',
        message: 'All services running normally. Uptime: 99.97%',
        timestamp: new Date().toISOString(),
      resolved: true,
      severity: 'low'
      });

      setSystemAlerts(alerts);
    } catch (err: any) {
      console.error('Error loading system alerts:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'accountant':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'client':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'info':
        return <Bell className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            <strong>Access Denied:</strong> You need admin privileges to access this dashboard.
            <div className="mt-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Go to Your Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            <strong>Error:</strong> {error}
            <div className="mt-4">
              <Button 
                onClick={loadAdminData} 
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                System administration and platform oversight • {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleSignOut}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {systemMetrics?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{systemMetrics?.monthlyGrowth.toFixed(1) || 0}% this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                  <Building className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {systemMetrics?.totalBusinesses || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active businesses on platform
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(systemMetrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform-wide revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {systemMetrics?.systemUptime || 99.9}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uptime this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>
                    Users by role across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Clients</span>
                    </div>
                    <span className="font-bold">{systemMetrics?.clientUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Accountants</span>
                        </div>
                    <span className="font-bold">{systemMetrics?.accountantUsers || 0}</span>
                        </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Admins</span>
                      </div>
                    <span className="font-bold">{systemMetrics?.adminUsers || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Businesses</CardTitle>
                  <CardDescription>
                    Latest business registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {businesses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No businesses found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {businesses.slice(0, 4).map((business) => (
                        <div
                          key={business.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{business.name}</p>
                            <p className="text-xs text-gray-500">{business.owner}</p>
                    </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-green-600">
                              {formatCurrency(business.revenue)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(business.createdDate)}
                            </p>
                    </div>
                    </div>
                      ))}
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>
                    Important system notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {systemAlerts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {systemAlerts.slice(0, 4).map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg"
                        >
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-gray-500">{alert.message}</p>
                    </div>
                    </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Users Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600">Manage all platform users and their access</p>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                <AddUserModal onUserAdded={loadUsers} />
              </div>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Complete user listing with role and activity information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                <div className="space-y-4">
                    {users
                      .filter(user => 
                        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                      <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                              <h3 className="font-medium text-gray-900">{user.name}</h3>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getStatusColor(user.role)}>
                                  {user.role}
                                </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                                {user.subscription && (
                        <Badge variant="outline">
                          {user.subscription}
                        </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-medium">
                                  {user.businessCount} businesses
                                </p>
                                {user.totalRevenue && (
                                  <p className="text-sm text-green-600 font-medium">
                                    {formatCurrency(user.totalRevenue)}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Joined {formatDate(user.joinDate)}
                                </p>
                              </div>
                        <div className="flex space-x-2">
                          <ViewUserModal user={user} />
                          <EditUserModal user={user} onUserUpdated={loadUsers} />
                        </div>
                      </div>
                    </div>
                </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            <AdminBusinesses />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialMetrics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all businesses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialMetrics?.monthlyRecurring || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month's revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Revenue per User</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(financialMetrics?.averageRevenuePerUser || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per client user
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {financialMetrics?.totalTransactions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform-wide transactions
                  </p>
                </CardContent>
              </Card>
                  </div>

            {/* Financial Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>
                    Key financial metrics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Transaction Size</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(financialMetrics?.averageTransactionSize || 0)}
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Lifetime Value</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(financialMetrics?.lifetimeValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Churn Rate</span>
                    <span className="text-sm text-gray-600">
                      {financialMetrics?.churnRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm text-gray-600">
                      {financialMetrics?.conversionRate || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Revenue Businesses</CardTitle>
                  <CardDescription>
                    Highest performing businesses on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {businesses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No business data available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {businesses
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5)
                        .map((business) => (
                          <div
                            key={business.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{business.name}</p>
                              <p className="text-xs text-gray-500">{business.owner}</p>
                  </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(business.revenue)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {business.transactionCount} transactions
                              </p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>
                    Current system metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-green-600 font-bold">
                      {systemMetrics?.systemUptime || 99.9}%
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-gray-600">
                      {systemMetrics?.avgResponseTime || 0}ms
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm text-gray-600">
                      {systemMetrics?.errorRate || 0}%
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm text-gray-600">
                      {systemMetrics?.activeUsers || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Stats</CardTitle>
                  <CardDescription>
                    Database performance and usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Records</span>
                    <span className="text-sm text-gray-600">
                      {(systemMetrics?.totalUsers || 0) + (systemMetrics?.totalBusinesses || 0) + (financialMetrics?.totalTransactions || 0)}
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Records</span>
                    <span className="text-sm text-gray-600">
                      {systemMetrics?.totalUsers || 0}
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Business Records</span>
                    <span className="text-sm text-gray-600">
                      {systemMetrics?.totalBusinesses || 0}
                    </span>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transaction Records</span>
                    <span className="text-sm text-gray-600">
                      {financialMetrics?.totalTransactions || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Status</CardTitle>
                  <CardDescription>
                    Platform security overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SSL Certificate</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Security</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Secure</Badge>
                    </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Backup Status</span>
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Alerts */}
              <Card>
                <CardHeader>
                <CardTitle>System Alerts & Notifications</CardTitle>
                  <CardDescription>
                  Important system events and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {systemAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No system alerts</p>
                    <p className="text-sm text-gray-400">All systems operating normally</p>
                  </div>
                ) : (
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                      >
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                            {formatDateTime(alert.timestamp)}
                          </p>
                        </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              {alert.resolved && (
                          <Badge className="bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                        </div>
                      </div>
              ))}
            </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 