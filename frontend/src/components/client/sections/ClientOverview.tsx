import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calendar,
  Upload,
  MessageSquare,
  Settings,
  Activity,
  Building,
  PieChart
} from 'lucide-react';

interface BusinessMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  pendingTransactions: number;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'approved' | 'rejected';
}

interface Business {
  id: string;
  name: string;
  owner_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const ClientOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Load user's businesses and financial data
  useEffect(() => {
    if (user) {
      loadClientData();
    }
  }, [user]);

  const loadClientData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load user's businesses
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .limit(50);

      if (businessError) throw businessError;

      const userBusinesses = businessData || [];
      
      // If no businesses exist, create a demo business for the user
      if (userBusinesses.length === 0 && user?.role === 'user') {
        console.log('🏢 No businesses found, creating demo business for client...');
        await createDemoBusinessForUser();
        return;
      }
      
      setBusinesses(userBusinesses);

      // Load data for the first business in parallel
      if (userBusinesses.length > 0) {
        const firstBusiness = userBusinesses[0];
        setSelectedBusiness(firstBusiness);
        
        await Promise.all([
          loadBusinessMetrics(firstBusiness.id),
          loadTransactions(firstBusiness.id)
        ]);
      }

    } catch (err: any) {
      console.error('Error loading client data:', err);
      setError(err.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  const createDemoBusinessForUser = async () => {
    if (!user?.id) return;

    try {
      // Create demo business
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: 'Demo Business',
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Create demo transactions
      const demoTransactions = [
        { business_id: newBusiness.id, amount: 5000, description: 'Client Payment', category: 'Revenue', type: 'income', status: 'approved' },
        { business_id: newBusiness.id, amount: -1200, description: 'Office Rent', category: 'Operating Expenses', type: 'expense', status: 'approved' },
        { business_id: newBusiness.id, amount: 3500, description: 'Consulting Services', category: 'Revenue', type: 'income', status: 'approved' },
        { business_id: newBusiness.id, amount: -800, description: 'Software Subscriptions', category: 'Technology', type: 'expense', status: 'pending' }
      ];

      await supabase.from('transactions').insert(demoTransactions);
      
      // Reload data
      await loadClientData();
    } catch (err: any) {
      console.error('Error creating demo business:', err);
      setError('Failed to create demo business');
    }
  };

  const loadBusinessMetrics = useCallback(async (businessId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('business_id', businessId);

      if (error) throw error;

      const revenue = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      const expenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      const pendingCount = transactions
        ?.filter(t => t.status === 'pending').length || 0;

      setMetrics({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netIncome: revenue - expenses,
        transactionCount: transactions?.length || 0,
        pendingTransactions: pendingCount
      });
    } catch (err: any) {
      console.error('Error loading metrics:', err);
    }
  }, []);

  const loadTransactions = useCallback(async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
    }
  }, []);

  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return (amount: number) => formatter.format(amount);
  }, []);

  const formatDate = useMemo(() => {
    return (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadClientData}>Try Again</Button>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SwiftBooks!</h2>
          <p className="text-gray-600 mb-6">
            We're setting up your business dashboard with sample data so you can explore all the features.
          </p>
          <Button onClick={createDemoBusinessForUser} className="w-full">
            <Building className="h-4 w-4 mr-2" />
            Create Demo Business Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Info */}
      {selectedBusiness && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Current Business</h3>
          <p className="text-blue-800">{selectedBusiness.name}</p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.transactionCount || 0} transactions total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Operating expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics?.netIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue minus expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.pendingTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/client/documents')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/client/ai-assistant')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with AI Assistant
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/client/meetings')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <PieChart className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/client/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Preview */}
      <Card>
        <CardHeader>
          <CardTitle>AI Financial Assistant</CardTitle>
          <CardDescription>
            Get intelligent insights about your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">💡 AI Insight</p>
                <p className="text-blue-800 text-sm mt-1">
                  {metrics?.netIncome && metrics.netIncome > 0 
                    ? `Your business is profitable with a net income of ${formatCurrency(metrics.netIncome)}. Consider investing in growth opportunities or building cash reserves.`
                    : 'Your expenses are higher than revenue. Consider reviewing your expense categories and identifying areas for cost reduction.'
                  }
                </p>
              </div>
            </div>
          </div>
          <Button 
            className="w-full"
            onClick={() => navigate('/client/ai-assistant')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start AI Chat Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 