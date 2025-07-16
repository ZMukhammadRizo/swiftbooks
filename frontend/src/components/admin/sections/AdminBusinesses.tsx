import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { AddBusinessModal } from '../../modals/AddBusinessModal';
import { ViewBusinessModal } from '../../modals/ViewBusinessModal';
import { ManageBusinessModal } from '../../modals/ManageBusinessModal';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
  Mail,
  Phone,
  MoreVertical,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface BusinessData {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'suspended' | null;
  monthly_fee: number | null;
  created_at: string | null;
  updated_at: string | null;
  owner_id: string;
  settings: any;
  
  // Joined data (may be null from database)
  owner: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  } | null;
  
  // Analytics data
  transaction_count: number;
  total_revenue: number;
  last_activity: string;
  employee_count: number;
  document_count: number;
}

interface BusinessStats {
  total_businesses: number;
  active_businesses: number;
  inactive_businesses: number;
  suspended_businesses: number;
  total_revenue: number;
  avg_monthly_fee: number;
  new_this_month: number;
}

export const AdminBusinesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const businessTypes = [
    'retail', 'restaurant', 'consulting', 'technology', 'healthcare',
    'real_estate', 'manufacturing', 'service', 'e_commerce', 'other'
  ];

  useEffect(() => {
    loadBusinesses();
    loadStats();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load businesses with owner information and analytics
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          *,
          owner:users!businesses_owner_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (businessError) throw businessError;

      // Load analytics for each business
      const businessesWithAnalytics = await Promise.all(
        (businessData || []).map(async (business) => {
          try {
            // Get transaction count and revenue (if documents table has transactions)
            const { count: transactionCount } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id);

            // Get document count
            const { count: documentCount } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('business_id', business.id);

            // Get last activity (latest document upload)
            const { data: lastActivity } = await supabase
              .from('documents')
              .select('created_at')
              .eq('business_id', business.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              ...business,
              owner: business.owner || { full_name: 'Unknown', email: 'unknown@example.com' },
              transaction_count: transactionCount || 0,
              total_revenue: business.monthly_fee * 12 || 0, // Simple calculation
              last_activity: lastActivity?.[0]?.created_at || business.created_at,
              employee_count: Math.floor(Math.random() * 50) + 1, // Mock data
              document_count: documentCount || 0,
            };
          } catch (error) {
            console.error('Error loading analytics for business:', business.id, error);
            return {
              ...business,
              owner: business.owner || { full_name: 'Unknown', email: 'unknown@example.com' },
              transaction_count: 0,
              total_revenue: 0,
              last_activity: business.created_at,
              employee_count: 0,
              document_count: 0,
            };
          }
        })
      );

      setBusinesses(businessesWithAnalytics);
    } catch (error: any) {
      console.error('Error loading businesses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get business counts by status
      const { data: businessStats, error: statsError } = await supabase
        .from('businesses')
        .select('status, monthly_fee, created_at');

      if (statsError) throw statsError;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: BusinessStats = {
        total_businesses: businessStats?.length || 0,
        active_businesses: businessStats?.filter(b => b.status === 'active').length || 0,
        inactive_businesses: businessStats?.filter(b => b.status === 'inactive').length || 0,
        suspended_businesses: businessStats?.filter(b => b.status === 'suspended').length || 0,
        total_revenue: businessStats?.reduce((sum, b) => sum + (b.monthly_fee || 0), 0) || 0,
        avg_monthly_fee: businessStats?.length ? 
          (businessStats.reduce((sum, b) => sum + (b.monthly_fee || 0), 0) / businessStats.length) : 0,
        new_this_month: businessStats?.filter(b => new Date(b.created_at) >= thisMonth).length || 0,
      };

      setStats(stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
    await loadStats();
    setRefreshing(false);
  };

  const handleBusinessUpdate = () => {
    loadBusinesses();
    loadStats();
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      loadStats();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      setError(error.message);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedBusinesses.length === 0) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', selectedBusinesses);

      if (error) throw error;

      setSelectedBusinesses([]);
      loadBusinesses();
      loadStats();
    } catch (error: any) {
      console.error('Error updating business status:', error);
      setError(error.message);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = business.name.toLowerCase().includes(searchLower) ||
                         (business.owner?.full_name?.toLowerCase() || '').includes(searchLower) ||
                         (business.owner?.email?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
    const matchesType = typeFilter === 'all' || business.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_businesses}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.new_this_month} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_businesses}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.active_businesses / stats.total_businesses) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats.avg_monthly_fee)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspended_businesses}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>Manage all businesses on the platform</CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <AddBusinessModal onBusinessAdded={handleBusinessUpdate}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </AddBusinessModal>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search businesses, owners, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {businessTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedBusinesses.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mt-4">
              <span className="text-sm text-blue-800">
                {selectedBusinesses.length} business(es) selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('active')}
                >
                  Set Active
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('inactive')}
                >
                  Set Inactive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('suspended')}
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBusinesses([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Business Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      checked={selectedBusinesses.length === filteredBusinesses.length && filteredBusinesses.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBusinesses(filteredBusinesses.map(b => b.id));
                        } else {
                          setSelectedBusinesses([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-2 font-medium">Business</th>
                  <th className="text-left p-2 font-medium">Owner</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Revenue</th>
                  <th className="text-left p-2 font-medium">Created</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedBusinesses.includes(business.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBusinesses(prev => [...prev, business.id]);
                          } else {
                            setSelectedBusinesses(prev => prev.filter(id => id !== business.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {business.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{business.owner?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {business.owner?.email || 'unknown@example.com'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">
                        {business.type?.charAt(0).toUpperCase() + business.type?.slice(1).replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusBadge(business.status || 'inactive')}>
                        {business.status || 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{formatCurrency(business.monthly_fee || 0)}/mo</div>
                        <div className="text-sm text-gray-500">
                          {business.document_count} docs
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        {formatDate(business.created_at)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <ViewBusinessModal 
                          business={{
                            id: business.id,
                            name: business.name,
                            owner: business.owner?.full_name || 'Unknown',
                            ownerEmail: business.owner?.email || 'unknown@example.com',
                            industry: business.type || 'Unknown',
                            status: (business.status as any) || 'inactive',
                            createdDate: business.created_at || new Date().toISOString(),
                            revenue: business.total_revenue,
                            employeeCount: business.employee_count,
                            subscription: 'basic' as any,
                            lastActivity: business.last_activity,
                            transactionCount: business.transaction_count
                          }}
                          trigger={
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                        
                        <ManageBusinessModal 
                          business={{
                            id: business.id,
                            name: business.name,
                            owner: business.owner?.full_name || 'Unknown',
                            ownerEmail: business.owner?.email || 'unknown@example.com',
                            industry: business.type || 'Unknown',
                            status: (business.status as any) || 'inactive',
                            createdDate: business.created_at || new Date().toISOString(),
                            revenue: business.total_revenue,
                            employeeCount: business.employee_count,
                            subscription: 'basic' as any,
                            lastActivity: business.last_activity,
                            transactionCount: business.transaction_count
                          }}
                          onBusinessUpdated={handleBusinessUpdate}
                          trigger={
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteBusiness(business.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {businesses.length === 0 ? 'No businesses found' : 'No businesses match your filters'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 