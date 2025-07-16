import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  MessageSquare,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Archive,
  CheckCircle
} from 'lucide-react';

// Interface definitions
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastActivity: string;
  totalRevenue: number;
  monthlyFee: number;
  businessCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  businesses: Business[];
  created_at: string;
  last_login?: string;
}

interface Business {
  id: string;
  name: string;
  status: string;
  total_revenue: number;
  monthly_fee: number;
  industry?: string;
}

export const AccountantClients: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Load clients data
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients based on search and filters
  useEffect(() => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(client => client.riskLevel === riskFilter);
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, statusFilter, riskFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

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
        phone: '', // Default empty phone
        role: user.role,
        status: 'active' as 'active' | 'inactive' | 'pending' | 'suspended', // Default to active
        lastActivity: user.updated_at || user.created_at,
        // Mock revenue data based on business count and age
        totalRevenue: user.businesses?.length ? Math.floor(Math.random() * 50000) + 10000 : 0,
        monthlyFee: user.businesses?.length ? user.businesses.length * 299 : 0,
        businessCount: user.businesses?.length || 0,
        riskLevel: user.businesses?.length === 0 ? 'high' : user.businesses?.length === 1 ? 'medium' : 'low',
        businesses: (user.businesses || []).map((business: any) => ({
          ...business,
          // Mock business revenue data
          total_revenue: Math.floor(Math.random() * 25000) + 5000,
          monthly_fee: 299,
          industry: ['Technology', 'Retail', 'Healthcare', 'Manufacturing', 'Services'][Math.floor(Math.random() * 5)]
        })),
        created_at: user.created_at,
        last_login: user.updated_at // Use updated_at as last_login equivalent
      }));

      setClients(transformedClients);

    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', clientId);

      if (error) throw error;

      // Update local state
      setClients(clients.map(client => 
        client.id === clientId 
          ? { ...client, status: newStatus as any }
          : client
      ));

    } catch (err: any) {
      console.error('Error updating client status:', err);
      setError(err.message || 'Failed to update client status');
    }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'suspended':
        return <Archive className="h-4 w-4 text-red-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage and monitor all your clients</p>
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
          <Button onClick={() => setShowAddClientModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.status === 'active').length}
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(clients.reduce((sum, client) => sum + client.totalRevenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(clients.reduce((sum, client) => sum + client.monthlyFee, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>
            Overview of all client accounts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all' 
                  ? 'No clients match your filters' 
                  : 'No clients found'}
              </p>
              <p className="text-sm text-gray-400">
                {clients.length === 0 
                  ? 'Add your first client to get started'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(client.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                        <Badge className={getRiskLevelColor(client.riskLevel)}>
                          {client.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{client.email}</p>
                      {client.phone && (
                        <p className="text-sm text-gray-500">📞 {client.phone}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          {client.businessCount} business{client.businessCount !== 1 ? 'es' : ''}
                        </span>
                        <span className="text-xs text-gray-400">
                          Last active: {formatDate(client.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(client.totalRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(client.monthlyFee)}/month
                    </p>
                    <div className="flex space-x-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientModal(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3" />
                      </Button>
                      <Select
                        value={client.status}
                        onValueChange={(value) => handleStatusChange(client.id, value)}
                      >
                        <SelectTrigger className="h-8 w-8 p-0 border rounded hover:bg-accent">
                          <MoreHorizontal className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Client Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{selectedClient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedClient.email}</p>
                </div>
                {selectedClient.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedClient.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedClient.status)}>
                    {selectedClient.status}
                  </Badge>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedClient.totalRevenue)}
                  </p>
                  <p className="text-sm text-green-600">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedClient.monthlyFee)}
                  </p>
                  <p className="text-sm text-blue-600">Monthly Fee</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {selectedClient.businessCount}
                  </p>
                  <p className="text-sm text-gray-600">Businesses</p>
                </div>
              </div>

              {/* Businesses */}
              {selectedClient.businesses.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Businesses</h4>
                  <div className="space-y-2">
                    {selectedClient.businesses.map((business) => (
                      <div key={business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{business.name}</p>
                          {business.industry && (
                            <p className="text-sm text-gray-500">{business.industry}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(business.total_revenue)}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(business.monthly_fee)}/month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientModal(false)}>
              Close
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal Placeholder */}
      <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Add New Client</span>
            </DialogTitle>
            <DialogDescription>
              Create a new client account
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Add client functionality coming soon!</p>
            <p className="text-sm text-gray-500">This will integrate with the user registration system.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClientModal(false)}>
              Cancel
            </Button>
            <Button disabled>
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 