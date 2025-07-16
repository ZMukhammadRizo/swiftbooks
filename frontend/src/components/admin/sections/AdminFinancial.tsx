import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Search, 
  Shield, 
  Calendar,
  Users,
  ArrowUpDown,
  Filter,
  Download,
  Eye,
  CreditCard,
  Wallet,
  PieChart
} from 'lucide-react';

interface FinancialTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_name: string;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  status: string;
  deadline: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
  progress_percentage: number;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  totalGoalTargets: number;
  totalGoalProgress: number;
  avgGoalCompletion: number;
  transactionCount: number;
  activeGoalsCount: number;
  topSpendingCategory: string;
  topIncomeSource: string;
}

export const AdminFinancial: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<FinancialGoal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    totalGoalTargets: 0,
    totalGoalProgress: 0,
    avgGoalCompletion: 0,
    transactionCount: 0,
    activeGoalsCount: 0,
    topSpendingCategory: '',
    topIncomeSource: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadFinancialData();
    }
  }, [user]);

  useEffect(() => {
    filterData();
  }, [transactions, goals, searchTerm, typeFilter, dateFilter, goalStatusFilter]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all financial data in parallel
      const [
        transactionsResult,
        goalsResult,
        usersResult
      ] = await Promise.all([
        // Load all transactions
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Load all goals
        supabase
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Load users for joining
        supabase
          .from('users')
          .select('id, email, metadata')
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (usersResult.error) throw usersResult.error;

      const rawTransactions = transactionsResult.data || [];
      const rawGoals = goalsResult.data || [];
      const users = usersResult.data || [];

      // Join user data with transactions
      const enrichedTransactions: FinancialTransaction[] = rawTransactions.map(transaction => {
        const relatedUser = users.find(u => u.id === transaction.user_id);
        return {
          ...transaction,
          user_email: relatedUser?.email,
          user_name: relatedUser?.metadata?.firstName 
            ? `${relatedUser.metadata.firstName} ${relatedUser.metadata.lastName || ''}`.trim()
            : relatedUser?.email?.split('@')[0]
        };
      });

      // Join user data with goals and calculate progress
      const enrichedGoals: FinancialGoal[] = rawGoals.map(goal => {
        const relatedUser = users.find(u => u.id === goal.user_id);
        return {
          ...goal,
          user_email: relatedUser?.email,
          user_name: relatedUser?.metadata?.firstName 
            ? `${relatedUser.metadata.firstName} ${relatedUser.metadata.lastName || ''}`.trim()
            : relatedUser?.email?.split('@')[0],
          progress_percentage: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
        };
      });

      setTransactions(enrichedTransactions);
      setGoals(enrichedGoals);

      // Calculate financial summary
      calculateFinancialSummary(enrichedTransactions, enrichedGoals);

    } catch (err: any) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialSummary = (transactions: FinancialTransaction[], goals: FinancialGoal[]) => {
    // Transaction statistics
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Category analysis
    const categoryTotals: { [key: string]: number } = {};
    const incomeSources: { [key: string]: number } = {};
    
    expenseTransactions.forEach(t => {
      const category = t.category_name || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    });
    
    incomeTransactions.forEach(t => {
      const source = t.category_name || 'Other';
      incomeSources[source] = (incomeSources[source] || 0) + t.amount;
    });
    
    const topSpendingCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b, ''
    );
    
    const topIncomeSource = Object.keys(incomeSources).reduce((a, b) => 
      incomeSources[a] > incomeSources[b] ? a : b, ''
    );

    // Goal statistics
    const totalGoalTargets = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalGoalProgress = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const avgGoalCompletion = goals.length > 0 
      ? goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length
      : 0;
    const activeGoalsCount = goals.filter(g => g.status === 'active').length;

    setSummary({
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      totalGoalTargets,
      totalGoalProgress,
      avgGoalCompletion,
      transactionCount: transactions.length,
      activeGoalsCount,
      topSpendingCategory,
      topIncomeSource
    });
  };

  const filterData = () => {
    let filteredTrans = transactions;
    let filteredGoalsData = goals;

    // Search filter for transactions
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredTrans = filteredTrans.filter(t => 
        t.description?.toLowerCase().includes(term) ||
        t.category_name?.toLowerCase().includes(term) ||
        t.user_email?.toLowerCase().includes(term) ||
        t.user_name?.toLowerCase().includes(term)
      );
      
      filteredGoalsData = filteredGoalsData.filter(g => 
        g.title?.toLowerCase().includes(term) ||
        g.category?.toLowerCase().includes(term) ||
        g.user_email?.toLowerCase().includes(term) ||
        g.user_name?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filteredTrans = filteredTrans.filter(t => t.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filteredTrans = filteredTrans.filter(t => new Date(t.date) >= cutoffDate);
    }

    // Goal status filter
    if (goalStatusFilter !== 'all') {
      filteredGoalsData = filteredGoalsData.filter(g => g.status === goalStatusFilter);
    }

    setFilteredTransactions(filteredTrans);
    setFilteredGoals(filteredGoalsData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user || user.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Administrator privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </p>
                <p className="text-xs text-gray-600">{summary.topIncomeSource}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </p>
                <p className="text-xs text-gray-600">{summary.topSpendingCategory}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netFlow)}
                </p>
                <p className="text-xs text-gray-600">{summary.transactionCount} transactions</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goal Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(summary.totalGoalProgress)}
                </p>
                <p className="text-xs text-gray-600">
                  {summary.avgGoalCompletion.toFixed(1)}% avg completion
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions, goals, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Select value={goalStatusFilter} onValueChange={setGoalStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Goal status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Data Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="goals">Financial Goals</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Platform Transactions</CardTitle>
                  <CardDescription>
                    Complete view of all user transactions ({filteredTransactions.length} shown)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Description</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 50).map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{transaction.user_name}</p>
                              <p className="text-sm text-gray-500">{transaction.user_email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{transaction.description || 'No description'}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {transaction.category_name || 'Uncategorized'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className={`font-bold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                          </td>
                          <td className="p-4">
                            <Badge 
                              className={transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                              }
                            >
                              {transaction.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions found matching your criteria.
                </div>
              )}

              {filteredTransactions.length > 50 && (
                <div className="text-center py-4 text-gray-500">
                  Showing first 50 of {filteredTransactions.length} transactions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Financial Goals</CardTitle>
                  <CardDescription>
                    Complete view of all user financial goals ({filteredGoals.length} shown)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Goal</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Progress</th>
                        <th className="text-left p-4 font-medium">Target</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGoals.slice(0, 50).map((goal) => (
                        <tr key={goal.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{goal.user_name}</p>
                              <p className="text-sm text-gray-500">{goal.user_email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{goal.title}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{goal.category}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{formatCurrency(goal.current_amount)}</span>
                                <span className={getProgressColor(goal.progress_percentage)}>
                                  {goal.progress_percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    goal.progress_percentage >= 100 ? 'bg-green-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium">
                            {formatCurrency(goal.target_amount)}
                          </td>
                          <td className="p-4">
                            <Badge 
                              className={
                                goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {goal.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredGoals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No goals found matching your criteria.
                </div>
              )}

              {filteredGoals.length > 50 && (
                <div className="text-center py-4 text-gray-500">
                  Showing first 50 of {filteredGoals.length} goals.
                </div>
              )}
      </CardContent>
    </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 