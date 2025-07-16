import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  Eye,
  Edit,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  RefreshCw,
  FileBarChart,
  TrendingUp,
  PieChart,
  BarChart3,
  DollarSign,
  Building,
  Archive,
  Send,
  Printer,
  Mail,
  Share
} from 'lucide-react';

// Interface definitions
interface Report {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'tax' | 'audit' | 'analysis' | 'compliance' | 'custom';
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived';
  client_id: string;
  client_name: string;
  period_start: string;
  period_end: string;
  generated_by: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  notes?: string;
  file_url?: string;
  file_size?: number;
  download_count?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
}

const reportTypes = [
  { value: 'monthly', label: 'Monthly Report', color: 'blue', icon: Calendar },
  { value: 'quarterly', label: 'Quarterly Report', color: 'green', icon: BarChart3 },
  { value: 'annual', label: 'Annual Report', color: 'purple', icon: TrendingUp },
  { value: 'tax', label: 'Tax Report', color: 'red', icon: FileBarChart },
  { value: 'audit', label: 'Audit Report', color: 'orange', icon: CheckCircle },
  { value: 'analysis', label: 'Analysis Report', color: 'teal', icon: PieChart },
  { value: 'compliance', label: 'Compliance Report', color: 'indigo', icon: AlertCircle },
  { value: 'custom', label: 'Custom Report', color: 'gray', icon: FileText }
];

const reportStatuses = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending_review', label: 'Pending Review', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'published', label: 'Published', color: 'blue' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'archived', label: 'Archived', color: 'gray' }
];

export const AccountantReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Form state
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'monthly' as Report['type'],
    client_id: '',
    period_start: '',
    period_end: '',
    notes: ''
  });

  // Load data
  useEffect(() => {
    loadReportsAndClients();
  }, []);

  // Filter reports
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(report => report.client_id === clientFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'this_week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'this_month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'this_quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'this_year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(report => 
          new Date(report.created_at) >= filterDate
        );
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, typeFilter, clientFilter, dateFilter]);

  const loadReportsAndClients = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadReports(),
        loadClients()
      ]);

    } catch (err: any) {
      console.error('Error loading reports and clients:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      // For now, we'll generate demo reports since we don't have a reports table yet
      // In a real implementation, this would query a reports table
      const demoReports: Report[] = [
        {
          id: '1',
          title: 'Q3 2024 Financial Report - Tech Startup LLC',
          type: 'quarterly',
          status: 'approved',
          client_id: 'client-1',
          client_name: 'Tech Startup LLC',
          period_start: '2024-07-01',
          period_end: '2024-09-30',
          generated_by: user?.id || 'accountant-1',
          approved_by: user?.id || 'accountant-1',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Strong quarterly performance with 25% revenue growth',
          file_size: 2458000,
          download_count: 5
        },
        {
          id: '2',
          title: 'Monthly Financial Summary - October 2024',
          type: 'monthly',
          status: 'pending_review',
          client_id: 'client-2',
          client_name: 'Real Estate Pro',
          period_start: '2024-10-01',
          period_end: '2024-10-31',
          generated_by: user?.id || 'accountant-1',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Pending review for property investment analysis',
          file_size: 1850000,
          download_count: 0
        },
        {
          id: '3',
          title: 'Tax Preparation Report 2024',
          type: 'tax',
          status: 'draft',
          client_id: 'client-3',
          client_name: 'Small Business Inc',
          period_start: '2024-01-01',
          period_end: '2024-12-31',
          generated_by: user?.id || 'accountant-1',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Annual tax filing preparation in progress',
          file_size: 3200000,
          download_count: 0
        },
        {
          id: '4',
          title: 'Compliance Audit Report - Q2 2024',
          type: 'compliance',
          status: 'published',
          client_id: 'client-2',
          client_name: 'Real Estate Pro',
          period_start: '2024-04-01',
          period_end: '2024-06-30',
          generated_by: user?.id || 'accountant-1',
          approved_by: user?.id || 'accountant-1',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'All compliance requirements met successfully',
          file_size: 1950000,
          download_count: 12
        },
        {
          id: '5',
          title: 'Annual Financial Analysis 2023',
          type: 'annual',
          status: 'archived',
          client_id: 'client-1',
          client_name: 'Tech Startup LLC',
          period_start: '2023-01-01',
          period_end: '2023-12-31',
          generated_by: user?.id || 'accountant-1',
          approved_by: user?.id || 'accountant-1',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Archived after successful year-end review',
          file_size: 4100000,
          download_count: 8
        }
      ];

      setReports(demoReports);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      throw err;
    }
  };

  const loadClients = async () => {
    try {
      const { data: clientUsers, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'user')
        .order('full_name');

      if (error) throw error;

      const transformedClients: Client[] = (clientUsers || []).map(user => ({
        id: user.id,
        name: user.email.split('@')[0] || user.email,
        email: user.email
      }));

      setClients(transformedClients);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      throw err;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportsAndClients();
    setRefreshing(false);
  };

  const handleGenerateReport = async () => {
    try {
      // In a real implementation, this would create a report in the database
      const newReport: Report = {
        id: Date.now().toString(),
        title: reportForm.title,
        type: reportForm.type,
        status: 'draft',
        client_id: reportForm.client_id,
        client_name: clients.find(c => c.id === reportForm.client_id)?.name || '',
        period_start: reportForm.period_start,
        period_end: reportForm.period_end,
        generated_by: user?.id || 'accountant-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: reportForm.notes,
        file_size: Math.floor(Math.random() * 3000000) + 500000, // Random file size
        download_count: 0
      };

      setReports([newReport, ...reports]);
      setShowGenerateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: Report['status']) => {
    try {
      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              approved_by: newStatus === 'approved' ? user?.id : report.approved_by
            }
          : report
      );
      setReports(updatedReports);
    } catch (err: any) {
      console.error('Error updating report status:', err);
      setError(err.message || 'Failed to update report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setReports(reports.filter(report => report.id !== reportId));
    } catch (err: any) {
      console.error('Error deleting report:', err);
      setError(err.message || 'Failed to delete report');
    }
  };

  const resetForm = () => {
    setReportForm({
      title: '',
      type: 'monthly',
      client_id: '',
      period_start: '',
      period_end: '',
      notes: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    const statusConfig = reportStatuses.find(s => s.value === status);
    const color = statusConfig?.color || 'gray';
    return `bg-${color}-100 text-${color}-800`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'published':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = reportTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
          <p className="text-gray-600">Generate, review, and manage client financial reports</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reports.filter(r => r.status === 'pending_review').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {reports.filter(r => r.status === 'approved' || r.status === 'published').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reports.filter(r => {
                    const reportDate = new Date(r.created_at);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && 
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {reportStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            Manage all client reports and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || clientFilter !== 'all' || dateFilter !== 'all'
                  ? 'No reports match your filters' 
                  : 'No reports found'}
              </p>
              <p className="text-sm text-gray-400">
                {reports.length === 0 
                  ? 'Generate your first report to get started'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(report.status)}
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                        {report.due_date && new Date(report.due_date) < new Date() && report.status !== 'published' && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getStatusColor(report.status)}>
                          {reportStatuses.find(s => s.value === report.status)?.label}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeIcon(report.type)}
                          <span className="ml-1">{reportTypes.find(t => t.value === report.type)?.label}</span>
                        </Badge>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {report.client_name}
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(report.period_start)} - {formatDate(report.period_end)}
                        </Badge>
                      </div>
                      
                      {report.notes && (
                        <p className="text-sm text-gray-600 mb-2">{report.notes}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {formatDate(report.created_at)}</span>
                        <span>Updated: {formatDate(report.updated_at)}</span>
                        {report.file_size && (
                          <span>Size: {formatFileSize(report.file_size)}</span>
                        )}
                        {report.download_count !== undefined && (
                          <span>Downloads: {report.download_count}</span>
                        )}
                        {report.due_date && (
                          <span>Due: {formatDate(report.due_date)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      
                      {report.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateReportStatus(report.id, 'pending_review')}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {report.status === 'pending_review' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateReportStatus(report.id, 'approved')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {report.status === 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateReportStatus(report.id, 'published')}
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {(report.status === 'published' || report.status === 'approved') && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Generate New Report</span>
            </DialogTitle>
            <DialogDescription>
              Create a new financial report for a client
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Report Title</label>
              <Input
                value={reportForm.title}
                onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                placeholder="Enter report title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Report Type</label>
                <Select value={reportForm.type} onValueChange={(value: Report['type']) => setReportForm({...reportForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Client</label>
                <Select value={reportForm.client_id} onValueChange={(value) => setReportForm({...reportForm, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Period Start</label>
                <Input
                  type="date"
                  value={reportForm.period_start}
                  onChange={(e) => setReportForm({...reportForm, period_start: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Period End</label>
                <Input
                  type="date"
                  value={reportForm.period_end}
                  onChange={(e) => setReportForm({...reportForm, period_end: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <Textarea
                value={reportForm.notes}
                onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                placeholder="Add any additional notes or comments"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={!reportForm.title || !reportForm.client_id || !reportForm.period_start || !reportForm.period_end}
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Report Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedReport?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-900">{selectedReport.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{reportTypes.find(t => t.value === selectedReport.type)?.label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Client</label>
                  <p className="text-gray-900">{selectedReport.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {reportStatuses.find(s => s.value === selectedReport.status)?.label}
                  </Badge>
                </div>
              </div>

              {/* Period and Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Period Start</label>
                  <p className="text-gray-900">{formatDate(selectedReport.period_start)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Period End</label>
                  <p className="text-gray-900">{formatDate(selectedReport.period_end)}</p>
                </div>
                {selectedReport.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p className="text-gray-900">{formatDate(selectedReport.due_date)}</p>
                  </div>
                )}
              </div>

              {/* File Info */}
              {selectedReport.file_size && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">File Size</label>
                    <p className="text-gray-900">{formatFileSize(selectedReport.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Downloads</label>
                    <p className="text-gray-900">{selectedReport.download_count || 0}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedReport.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-gray-900 mt-1">{selectedReport.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="font-medium">Created</label>
                  <p>{formatDate(selectedReport.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium">Last Updated</label>
                  <p>{formatDate(selectedReport.updated_at)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            {selectedReport?.status === 'approved' || selectedReport?.status === 'published' ? (
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 