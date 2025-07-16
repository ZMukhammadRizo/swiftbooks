import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AddClientModal } from '@/components/modals/AddClientModal';
import { AddTaskModal } from '@/components/modals/AddTaskModal';
import { GenerateReportModal } from '@/components/modals/GenerateReportModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Clock,
  Building,
  PieChart,
  BarChart3,
  Activity,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

// Real data interfaces
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastActivity: string;
  totalRevenue: number;
  monthlyFee: number;
  nextMeeting?: string;
  riskLevel: 'low' | 'medium' | 'high';
  businessCount: number;
  businesses: any[];
}

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

interface Task {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  type: 'review' | 'report' | 'meeting' | 'tax_filing';
  businessId?: string;
}

interface Report {
  id: string;
  title: string;
  client: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary';
  status: 'draft' | 'pending_review' | 'approved' | 'published';
  createdDate: string;
  dueDate: string;
  businessId: string;
}

export const AccountantDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);

  // Real data state
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Load all accountant data
  useEffect(() => {
    if (user) {
      loadAccountantData();
    }
  }, [user]);

  const loadAccountantData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadClients(),
        loadReports(),
        loadTasks(),
        loadFinancialOverview()
      ]);

    } catch (err: any) {
      console.error('Error loading accountant data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      // Get all client users
      const { data: clientUsers, error: clientError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user');

      if (clientError) throw clientError;

      // Transform data and calculate metrics for each client
      const transformedClients: Client[] = await Promise.all(
        (clientUsers || []).map(async (clientUser) => {
          // Get businesses owned by this client
          const { data: businesses } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', clientUser.id);
          
          // Calculate total revenue for this client across all their businesses
          let totalRevenue = 0;
          let monthlyFee = 0;
          
          for (const business of businesses || []) {
            const { data: transactions } = await supabase
              .from('transactions')
              .select('amount, type')
              .eq('business_id', business.id)
              .eq('type', 'income');
            
            const businessRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            totalRevenue += businessRevenue;
            monthlyFee += 299; // Fixed monthly fee per business
          }

          // Determine risk level based on activity and revenue
          const riskLevel = totalRevenue < 10000 ? 'high' : 
                           totalRevenue < 50000 ? 'medium' : 'low';

          return {
            id: clientUser.id,
            name: clientUser.email?.split('@')[0] || 'Unknown Client',
            email: clientUser.email || '',
            phone: '', // Default empty phone
            role: clientUser.role,
            status: 'active' as const, // Could be determined by last login, subscription status, etc.
            lastActivity: clientUser.updated_at || clientUser.created_at,
            totalRevenue,
            monthlyFee,
            riskLevel,
            businessCount: (businesses || []).length,
            businesses: businesses || []
          };
        })
      );

      setClients(transformedClients);
    } catch (err: any) {
      console.error('Error loading clients:', err);
    }
  };

  const loadReports = async () => {
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          business:businesses(
            name,
            owner_id,
            user:users(email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reportsError) throw reportsError;

      const transformedReports: Report[] = (reportsData || []).map(report => ({
        id: report.id,
        title: report.title,
        client: report.business?.user?.email?.split('@')[0] || 'Unknown Client',
        type: report.type,
        status: report.status,
        createdDate: report.created_at,
        dueDate: report.period_end || report.created_at,
        businessId: report.business_id
      }));

      setReports(transformedReports);
    } catch (err: any) {
      console.error('Error loading reports:', err);
    }
  };

  const loadTasks = async () => {
    try {
      // Generate tasks based on recent activity and business needs
      const generatedTasks: Task[] = [];

      // Add report review tasks for pending reports
      const pendingReports = reports.filter(r => r.status === 'pending_review');
      pendingReports.forEach(report => {
        generatedTasks.push({
          id: `report-${report.id}`,
          title: `Review ${report.title}`,
          client: report.client,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          priority: 'medium',
          status: 'pending',
          type: 'review',
          businessId: report.businessId
        });
      });

      // Add meeting tasks for meetings scheduled in the future
      const { data: upcomingMeetings } = await supabase
        .from('meetings')
        .select(`
          *,
          business:businesses(
            name,
            user:users(email)
          )
        `)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      (upcomingMeetings || []).forEach(meeting => {
        generatedTasks.push({
          id: `meeting-${meeting.id}`,
          title: `Meeting: ${meeting.title}`,
          client: meeting.business?.user?.email?.split('@')[0] || 'Unknown Client',
          dueDate: meeting.scheduled_at,
      priority: 'high',
      status: 'pending',
          type: 'meeting',
          businessId: meeting.business_id
        });
      });

      // Add monthly report generation tasks for active clients
      clients.slice(0, 5).forEach(client => {
        generatedTasks.push({
          id: `monthly-${client.id}`,
          title: `Generate Monthly Report - ${client.name}`,
          client: client.name,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      priority: 'medium',
      status: 'pending',
      type: 'report'
        });
      });

      setTasks(generatedTasks.slice(0, 10)); // Limit to 10 most important tasks
    } catch (err: any) {
      console.error('Error loading tasks:', err);
    }
  };

  const loadFinancialOverview = async () => {
    try {
      // Calculate overview metrics from client data
      const totalClientsRevenue = clients.reduce((sum, client) => sum + client.totalRevenue, 0);
      const monthlyRecurringRevenue = clients.reduce((sum, client) => sum + client.monthlyFee, 0);
      const activeClients = clients.filter(c => c.status === 'active').length;
      const pendingReviews = reports.filter(r => r.status === 'pending_review').length;
      const completedReports = reports.filter(r => r.status === 'approved' || r.status === 'published').length;

      setFinancialOverview({
        totalClientsRevenue,
        monthlyRecurringRevenue,
        pendingReviews,
        completedReports,
        avgClientGrowth: 15.8, // This would need historical data to calculate properly
        clientRetentionRate: 94.2, // This would need historical data to calculate properly
        totalClients: clients.length,
        activeClients
      });
    } catch (err: any) {
      console.error('Error loading financial overview:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccountantData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // Modal handlers
  const handleClientAdded = () => {
    loadClients();
  };

  const handleTaskAdded = () => {
    loadTasks();
  };

  const handleReportGenerated = () => {
    loadReports();
  };

  const handleViewClient = (client: Client) => {
    alert(`Client Details:\n\nName: ${client.name}\nEmail: ${client.email}\nPhone: ${client.phone || 'N/A'}\nTotal Revenue: $${client.totalRevenue.toLocaleString()}\nMonthly Fee: $${client.monthlyFee.toLocaleString()}\nBusinesses: ${client.businessCount}\nRisk Level: ${client.riskLevel}\nStatus: ${client.status}\n\nNote: Full client detail view would be implemented in production.`);
  };

  const handleContactClient = (client: Client) => {
    const emailSubject = encodeURIComponent(`Follow-up from SwiftBooks - ${client.name}`);
    const emailBody = encodeURIComponent(`Dear ${client.name},\n\nI hope this message finds you well. I wanted to follow up regarding your account and see if you have any questions about your recent financial reports or upcoming tasks.\n\nPlease feel free to reach out if you need any assistance.\n\nBest regards,\n${user?.email}`);
    
    window.open(`mailto:${client.email}?subject=${emailSubject}&body=${emailBody}`);
  };

  const handleViewTask = (task: Task) => {
    alert(`Task Details:\n\nTitle: ${task.title}\nClient: ${task.client}\nType: ${task.type}\nPriority: ${task.priority}\nStatus: ${task.status}\nDue Date: ${new Date(task.dueDate).toLocaleDateString()}\n\nNote: Full task detail view would be implemented in production.`);
  };

  const handleEditTask = (task: Task) => {
    alert(`Edit Task: ${task.title}\n\nThis would open an edit modal in production where you could modify:\n- Task title and description\n- Due date and priority\n- Status and assignee\n- Additional notes\n\nFor now, this is a placeholder.`);
  };

  const handleReviewReport = (report: Report) => {
    alert(`Report Review: ${report.title}\n\nClient: ${report.client}\nType: ${report.type.replace('_', ' ')}\nStatus: ${report.status.replace('_', ' ')}\nCreated: ${new Date(report.createdDate).toLocaleDateString()}\nDue: ${new Date(report.dueDate).toLocaleDateString()}\n\nThis would open the full report for review in production.`);
  };

  const handleDownloadReport = (report: Report) => {
    // Simulate report download
    const reportData = `${report.title}\n\nClient: ${report.client}\nType: ${report.type.replace('_', ' ')}\nGenerated: ${new Date().toLocaleDateString()}\n\nThis is a sample report. In production, this would contain actual financial data and calculations based on the client's business transactions.\n\nReport Status: ${report.status.replace('_', ' ')}\nCreated: ${new Date(report.createdDate).toLocaleDateString()}\nDue Date: ${new Date(report.dueDate).toLocaleDateString()}`;
    
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  };

  const handleExportReports = () => {
    const exportData = reports.map(report => ({
      title: report.title,
      client: report.client,
      type: report.type,
      status: report.status,
      created: report.createdDate,
      due: report.dueDate
    }));
    
    const csv = [
      'Title,Client,Type,Status,Created,Due Date',
      ...exportData.map(row => `"${row.title}","${row.client}","${row.type}","${row.status}","${row.created}","${row.due}"`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reports_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accountant dashboard...</p>
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
                onClick={loadAccountantData} 
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
              <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
              <p className="text-sm text-gray-600">
                Manage clients and financial operations • {user?.email}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                    From {financialOverview?.totalClients || 0} total clients
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <FileText className="h-4 w-4 text-yellow-600" />
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
              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Urgent Tasks</CardTitle>
                  <CardDescription>
                    Tasks requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No urgent tasks</p>
                          </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start space-x-3">
                            {getPriorityIcon(task.priority)}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {task.client} • Due {formatDate(task.dueDate)}
                              </p>
                          </div>
                        </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Client Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients</CardTitle>
                  <CardDescription>
                    Highest revenue generating clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No clients found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clients
                        .sort((a, b) => b.totalRevenue - a.totalRevenue)
                        .slice(0, 5)
                        .map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                        <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                          <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {client.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {client.businessCount} businesses
                                </p>
                          </div>
                        </div>
                        <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(client.totalRevenue)}
                          </p>
                              <Badge className={getStatusColor(client.status)}>
                                {client.status}
                          </Badge>
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

          <TabsContent value="clients" className="space-y-6">
            {/* Client Search and Filters */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="high-revenue">High Revenue</option>
                </select>
              </div>
              <Button onClick={() => setShowAddClientModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients
                .filter(client => {
                  const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      client.email.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesFilter = selectedFilter === 'all' ||
                                      (selectedFilter === 'active' && client.status === 'active') ||
                                      (selectedFilter === 'inactive' && client.status === 'inactive') ||
                                      (selectedFilter === 'high-revenue' && client.totalRevenue > 50000);
                  return matchesSearch && matchesFilter;
                })
                .map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                            <CardDescription>{client.email}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Revenue</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(client.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Monthly Fee</p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(client.monthlyFee)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Businesses</p>
                          <p className="font-medium">{client.businessCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Risk Level</p>
                          <Badge className={
                            client.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            client.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {client.riskLevel}
                        </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewClient(client)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                          </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleContactClient(client)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact
                          </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {/* Tasks Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
                <p className="text-gray-600">Track and manage client-related tasks</p>
              </div>
              <Button onClick={() => setShowAddTaskModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Tasks List */}
              <Card>
                <CardHeader>
                <CardTitle>All Tasks</CardTitle>
                  <CardDescription>
                  Current tasks requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks found</p>
                    <p className="text-sm text-gray-400">Tasks will appear here as they are created</p>
                            </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                            {getPriorityIcon(task.priority)}
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Client: {task.client} • Due: {formatDate(task.dueDate)}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline">{task.type}</Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                          </Badge>
                        </div>
                      </div>
                  </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Reports Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
                <p className="text-gray-600">Review and manage client financial reports</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleExportReports}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setShowGenerateReportModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports found</p>
                  <p className="text-sm text-gray-400">Reports will appear here as they are generated</p>
                        </div>
              ) : (
                reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription>
                            Client: {report.client} • {report.type.replace('_', ' ')}
                          </CardDescription>
                          </div>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{formatDate(report.createdDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-medium">{formatDate(report.dueDate)}</p>
                        </div>
                      </div>
                        <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleReviewReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                          </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                          </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
                    </div>

      {/* Modals */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientAdded={handleClientAdded}
      />
      
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onTaskAdded={handleTaskAdded}
      />
      
      <GenerateReportModal
        isOpen={showGenerateReportModal}
        onClose={() => setShowGenerateReportModal(false)}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
}; 