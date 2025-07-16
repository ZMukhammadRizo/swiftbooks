import React, { useState, useEffect, useCallback } from 'react';
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
  Target, 
  Upload,
  Activity,
  PieChart,
  Wallet,
  Plus,
  Calendar
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PersonalMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  monthlyBudget: number;
  budgetUsed: number;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  date: string;
  type: 'income' | 'expense';
}

interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string;
}

export const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PersonalMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  // Load user's personal financial data
  useEffect(() => {
    if (user) {
      loadPersonalFinanceData();
    }
  }, [user]);

  const loadPersonalFinanceData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load data in parallel for better performance
      const [transactionsResult, goalsResult, budgetsResult] = await Promise.all([
        // Load transactions for current month
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
          .order('date', { ascending: false }),
        
        // Load active financial goals
        supabase
          .from('financial_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('deadline', { ascending: true }),
        
        // Load current month's budget
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
          .lte('end_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0])
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (budgetsResult.error) throw budgetsResult.error;

      const transactions = transactionsResult.data || [];
      const goals = goalsResult.data || [];
      const budgets = budgetsResult.data || [];

      // Calculate metrics from real data
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      const monthlyBudget = budgets
        .reduce((sum, b) => sum + Number(b.amount), 0);

      const budgetUsed = budgets
        .reduce((sum, b) => sum + Number(b.spent_amount || 0), 0);

      const personalMetrics: PersonalMetrics = {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        monthlyBudget: monthlyBudget || 4000, // Default if no budget set
        budgetUsed
      };

      // Get recent transactions (last 5)
      const recentTrans = transactions.slice(0, 5).map(t => ({
        id: t.id,
        amount: t.type === 'expense' ? -Math.abs(Number(t.amount)) : Number(t.amount),
        description: t.description || 'No description',
        category_name: t.category_name || 'Other',
        date: t.date,
        type: t.type as 'income' | 'expense'
      }));

      // Map goals with proper null handling
      const mappedGoals = goals.map(g => ({
        id: g.id,
        title: g.title,
        target_amount: g.target_amount,
        current_amount: g.current_amount || 0,
        deadline: g.deadline,
        category: g.category
      }));

      setMetrics(personalMetrics);
      setRecentTransactions(recentTrans);
      setGoals(mappedGoals);

      // If no data exists, show helpful message
      if (transactions.length === 0 && goals.length === 0) {
        setError('No financial data found. Start by adding some transactions and setting financial goals!');
      }

    } catch (err: any) {
      console.error('Error loading personal finance data:', err);
      setError(err.message || 'Failed to load personal finance data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getGoalProgress = (goal: FinancialGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          <strong>Getting Started:</strong> {error}
          <div className="mt-4 space-x-2">
            <Button onClick={() => navigate('/user/transactions')} variant="outline">
              Add Transactions
            </Button>
            <Button onClick={() => navigate('/user/goals')} variant="outline">
              Set Goals
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month's income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month's spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics?.netSavings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income minus expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/user/transactions')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/user/transactions')}
                >
                  Add Your First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                ))}
                
                <div className="text-center pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/user/transactions')}
                  >
                    View All Transactions
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Track your savings progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/user/goals')}>
              <Target className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No financial goals set</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/user/goals')}
                >
                  Create Your First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const progress = getGoalProgress(goal);
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{goal.title}</p>
                          <p className="text-sm text-gray-500">{goal.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(goal.current_amount)}</p>
                          <p className="text-sm text-gray-500">of {formatCurrency(goal.target_amount)}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{Math.round(progress)}% complete</span>
                        {goal.deadline && (
                          <span>Due {formatDate(goal.deadline)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="text-center pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/user/goals')}
                  >
                    View All Goals
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/user/transactions')}
            >
              <Plus className="h-6 w-6" />
              <span>Add Transaction</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/user/goals')}
            >
              <Target className="h-6 w-6" />
              <span>Set Goal</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/user/analytics')}
            >
              <PieChart className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 