import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useAuthWithNavigation } from '@/contexts/AuthContext';
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
  LogOut,
  RefreshCw,
  PieChart,
  BarChart3,
  Activity,
  Building
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountSettingsModal } from '@/components/modals/AccountSettingsModal';
import { DocumentUploadModal } from '@/components/modals/DocumentUploadModal';
import { AIAssistantModal } from '@/components/modals/AIAssistantModal';

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
  settings: any;
}

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { signOutWithRedirect } = useAuthWithNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
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
        .limit(50); // Add reasonable limit

      if (businessError) throw businessError;

      const userBusinesses = businessData || [];
      
      // If no businesses exist, create a demo business for the user
      if (userBusinesses.length === 0 && user?.role === 'user') {
        console.log('🏢 No businesses found, creating demo business for client...');
        await createDemoBusinessForUser();
        return; // This will trigger a reload
      }
      
      setBusinesses(userBusinesses);

      // Load data for the first business in parallel
      if (userBusinesses.length > 0) {
        const firstBusiness = userBusinesses[0];
        setSelectedBusiness(firstBusiness);
        
        // Run metrics and transactions queries in parallel for better performance
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

  const createDemoBusinessForUser = useCallback(async () => {
    if (!user?.id || !user?.email) return;
    
    try {
      console.log('🏢 Creating demo business for user:', user.email);
      setLoading(true);
      
      // Create a demo business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: `${user.email.split('@')[0]} Business`,
          owner_id: user.id,
          settings: {
            industry: 'Professional Services',
            fiscal_year_start: '2024-01-01',
            currency: 'USD',
            timezone: 'America/New_York'
          }
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Create sample transactions in a single batch insert for better performance
      const sampleTransactions = [
        {
          business_id: business.id,
          amount: 5000.00,
          description: 'Monthly service revenue',
          category: 'Service Revenue',
          date: '2024-01-15',
          type: 'income',
          status: 'approved'
        },
        {
          business_id: business.id,
          amount: 3200.00,
          description: 'Consulting fees',
          category: 'Consulting',
          date: '2024-01-20',
          type: 'income',
          status: 'approved'
        },
        {
          business_id: business.id,
          amount: 1200.00,
          description: 'Office rent',
          category: 'Rent',
          date: '2024-01-01',
          type: 'expense',
          status: 'approved'
        },
        {
          business_id: business.id,
          amount: 800.00,
          description: 'Software subscriptions',
          category: 'Software',
          date: '2024-01-05',
          type: 'expense',
          status: 'approved'
        },
        {
          business_id: business.id,
          amount: 2100.00,
          description: 'Recent client payment',
          category: 'Service Revenue',
          date: '2024-02-20',
          type: 'income',
          status: 'approved'
        }
      ];

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(sampleTransactions);

      if (transactionError) {
        console.warn('⚠️ Could not create sample transactions:', transactionError);
        // Don't throw error, business creation was successful
      }

      console.log('✅ Demo business created successfully!');
      
      // Reload the data
      await loadClientData();

    } catch (err: any) {
      console.error('❌ Error creating demo business:', err);
      
      // Provide helpful error message based on error type
      if (err.code === '42501') {
        setError('Database permissions need to be configured. Please run the RLS policy fix in your Supabase dashboard.');
      } else if (err.code === '23505') {
        setError('A business with this name already exists. Please try again.');
      } else {
        setError(`Failed to set up demo business: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, loadClientData]);



  const loadBusinessMetrics = useCallback(async (businessId: string) => {
    try {
      // Load only necessary transaction data for metrics calculation
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('business_id', businessId)
        .limit(1000); // Reasonable limit for performance

      if (transactionError) throw transactionError;

      // Calculate metrics efficiently
      let revenue = 0;
      let expenses = 0;
      let pending = 0;
      
      transactionData?.forEach(t => {
        const amount = Number(t.amount);
        if (t.type === 'income') revenue += amount;
        else if (t.type === 'expense') expenses += amount;
        if (t.status === 'pending') pending++;
      });

      setMetrics({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netIncome: revenue - expenses,
        transactionCount: transactionData?.length || 0,
        pendingTransactions: pending
      });

    } catch (err: any) {
      console.error('Error loading business metrics:', err);
    }
  }, []);

  const loadTransactions = useCallback(async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, description, category, date, type, status')
        .eq('business_id', businessId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);

    } catch (err: any) {
      console.error('Error loading transactions:', err);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (selectedBusiness) {
      setRefreshing(true);
      try {
        // Run both queries in parallel for better performance
        await Promise.all([
          loadBusinessMetrics(selectedBusiness.id),
          loadTransactions(selectedBusiness.id)
        ]);
      } catch (err) {
        console.error('Error refreshing data:', err);
      } finally {
        setRefreshing(false);
      }
    }
  }, [selectedBusiness, loadBusinessMetrics, loadTransactions]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <div className="mt-4 space-y-2">
              <Button 
                onClick={loadClientData} 
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
              {user?.role === 'user' && (
                <Button 
                  onClick={createDemoBusinessForUser} 
                  className="w-full"
                >
                  Create Demo Business
                </Button>
              )}
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
              <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.email}
                {selectedBusiness && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {selectedBusiness.name}
                  </span>
                )}
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
                onClick={signOutWithRedirect}
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


        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SwiftBooks!</h2>
              <p className="text-gray-600 mb-6">
                We're setting up your business dashboard with sample data so you can explore all the features.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-blue-800 font-medium">Setting up your demo business...</span>
                </div>
                <p className="text-blue-700 text-sm">
                  This includes sample transactions, financial metrics, and reports to help you get started.
                </p>
              </div>
              <div className="text-left bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">What you'll be able to do:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• View financial dashboards (P&L, cash flow, KPIs)</li>
                  <li>• Ask the AI assistant financial questions</li>
                  <li>• Upload and manage documents</li>
                  <li>• Generate and download reports</li>
                  <li>• Schedule meetings with accountants</li>
                  <li>• Track real estate hours (for IRS classification)</li>
                  <li>• Access investor due diligence tools</li>
                </ul>
              </div>
              <div className="mt-6">
                <Button 
                  onClick={createDemoBusinessForUser}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Demo Business...
                    </>
                  ) : (
                    <>
                      <Building className="h-4 w-4 mr-2" />
                      Create Demo Business Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will create a sample business with demo data for you to explore
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    onClick={() => setShowDocumentUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowAIAssistant(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with AI Assistant
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
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
                    onClick={() => setShowAccountSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* AI Assistant Preview */}
            <Card className="mt-6">
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
                  onClick={() => setShowAIAssistant(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start AI Chat Session
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal 
        isOpen={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal 
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />
    </div>
  );
}; 