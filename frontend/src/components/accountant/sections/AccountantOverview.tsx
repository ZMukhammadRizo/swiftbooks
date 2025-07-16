import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Activity,
  Calendar,
  Plus,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';

// Interfaces for data structures
interface FinancialOverview {
  totalClientsRevenue: number;
  monthlyRecurringRevenue: number;
  pendingReviews: number;
  completedReports: number;
  avgClientGrowth: number;
  clientRetentionRate: number;
  totalClients: number;
  activeClients: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastActivity: string;
  totalRevenue: number;
  monthlyFee: number;
  businessCount: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RecentActivity {
  id: string;
  type: 'client_signup' | 'report_generated' | 'task_completed' | 'meeting_scheduled';
  description: string;
  timestamp: string;
  clientName?: string;
}

export const AccountantOverview: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Load all overview data
  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadClients(),
        loadRecentActivity()
      ]);

    } catch (err: any) {
      console.error('Error loading overview data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      // Load users (users with role 'user') and their businesses
      const { data: userUsers, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          created_at,
          updated_at,
          businesses (
            id,
            name,
            created_at
          )
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Transform the data into Client format
      const transformedClients: Client[] = (userUsers || []).map(user => ({
        id: user.id,
        name: user.email.split('@')[0] || user.email, // Extract name from email
        email: user.email,
        role: user.role,
        status: 'active' as 'active' | 'inactive' | 'pending', // Default to active
        lastActivity: user.updated_at || user.created_at,
        // Mock revenue data based on business count and age
        totalRevenue: user.businesses?.length ? Math.floor(Math.random() * 50000) + 10000 : 0,
        monthlyFee: user.businesses?.length ? user.businesses.length * 299 : 0,
        businessCount: user.businesses?.length || 0,
        riskLevel: user.businesses?.length === 0 ? 'high' : user.businesses?.length === 1 ? 'medium' : 'low'
      }));

      setClients(transformedClients);

      // Calculate financial overview from client data
      calculateFinancialOverview(transformedClients);

    } catch (err: any) {
      console.error('Error loading clients:', err);
      throw err;
    }
  };

  const calculateFinancialOverview = (clientData: Client[]) => {
    const totalClientsRevenue = clientData.reduce((sum, client) => sum + client.totalRevenue, 0);
    const monthlyRecurringRevenue = clientData.reduce((sum, client) => sum + client.monthlyFee, 0);
    const activeClients = clientData.filter(c => c.status === 'active').length;
    const totalClients = clientData.length;

    // Generate some realistic demo data for reports
    const pendingReviews = Math.floor(Math.random() * 12) + 3; // 3-15 pending reviews
    const completedReports = Math.floor(Math.random() * 20) + 15; // 15-35 completed reports

    setFinancialOverview({
      totalClientsRevenue,
      monthlyRecurringRevenue,
      pendingReviews,
      completedReports,
      avgClientGrowth: 15.8, // Would need historical data
      clientRetentionRate: 94.2, // Would need historical data
      totalClients,
      activeClients
    });
  };

  const loadRecentActivity = async () => {
    try {
      // For now, generate some realistic recent activity
      // In a real app, this would come from an activity log table
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'client_signup',
          description: 'New client registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          clientName: 'Sarah Johnson'
        },
        {
          id: '2',
          type: 'report_generated',
          description: 'Monthly financial report generated',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          clientName: 'Tech Startup LLC'
        },
        {
          id: '3',
          type: 'task_completed',
          description: 'Tax filing task completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          clientName: 'Real Estate Pro'
        },
        {
          id: '4',
          type: 'meeting_scheduled',
          description: 'Consultation meeting scheduled',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          clientName: 'Small Business Inc'
        }
      ];

      setRecentActivity(activities);
    } catch (err: any) {
      console.error('Error loading recent activity:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_signup':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'report_generated':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'meeting_scheduled':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accountant Overview</h2>
          <p className="text-gray-600">Monitor client accounts and business performance</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialOverview?.totalClientsRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialOverview?.activeClients || 0} active clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialOverview?.monthlyRecurringRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +15.8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {financialOverview?.pendingReviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialOverview?.completedReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Client
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      {activity.clientName && (
                        <p className="text-xs text-gray-500">
                          Client: {activity.clientName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Client Summary</CardTitle>
          <CardDescription>Overview of your top clients by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No clients found</p>
              <p className="text-sm text-gray-400">Clients will appear here as they register</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{client.status}</Badge>
                          <Badge className={getRiskLevelColor(client.riskLevel)}>
                            {client.riskLevel} risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(client.totalRevenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {client.businessCount} business{client.businessCount !== 1 ? 'es' : ''}
                      </p>
                      <div className="flex space-x-1 mt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 