import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';

interface CategorySpending {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface GoalProgress {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  current_amount: number;
  progress_percentage: number;
  status: string;
  deadline: string | null;
}

interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
}

export const UserAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Analytics data state
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [avgDailySpending, setAvgDailySpending] = useState(0);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get date range for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      // Load all analytics data in parallel
      const [
        transactionsResult,
        goalsResult
      ] = await Promise.all([
        // Get all transactions for analysis
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .order('date', { ascending: false }),
        
        // Get goals progress
        supabase
          .from('financial_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (goalsResult.error) throw goalsResult.error;

      const transactions = transactionsResult.data || [];
      const goals = goalsResult.data || [];

      // Process analytics data
      processTransactionAnalytics(transactions);
      processGoalAnalytics(goals);

    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processTransactionAnalytics = (transactions: any[]) => {
    if (transactions.length === 0) {
      setCategorySpending([]);
      setMonthlyData([]);
      setSpendingTrends([]);
      setTotalTransactions(0);
      setAvgDailySpending(0);
      return;
    }

    setTotalTransactions(transactions.length);

    // Calculate category spending (expenses only)
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals: { [key: string]: { amount: number; count: number } } = {};
    
    expenseTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 };
      }
      categoryTotals[category].amount += Math.abs(transaction.amount);
      categoryTotals[category].count += 1;
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
    
    const categoryData: CategorySpending[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    setCategorySpending(categoryData);

    // Calculate monthly data for last 6 months
    const monthlyTotals: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyTotals[monthKey].income += transaction.amount;
      } else {
        monthlyTotals[monthKey].expenses += Math.abs(transaction.amount);
      }
    });

    const monthlyAnalytics: MonthlyData[] = Object.entries(monthlyTotals)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyData(monthlyAnalytics);

    // Calculate spending trends (last 4 weeks)
    const today = new Date();
    const trends: SpendingTrend[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7 + 6));
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      
      const weekExpenses = expenseTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate >= weekStart && tDate <= weekEnd;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      trends.push({
        period: `Week ${4 - i}`,
        amount: weekExpenses,
        change: i === 3 ? 0 : weekExpenses - (trends[trends.length - 1]?.amount || 0)
      });
    }

    setSpendingTrends(trends);

    // Calculate average daily spending (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExpenses = expenseTransactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    setAvgDailySpending(recentExpenses / 30);
  };

  const processGoalAnalytics = (goals: any[]) => {
    const goalAnalytics: GoalProgress[] = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      progress_percentage: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      status: goal.status,
      deadline: goal.deadline
    }));

    setGoalProgress(goalAnalytics);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <ArrowUpDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (totalTransactions === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600 mb-6">
          Start adding transactions to see your financial analytics and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Daily Spending</p>
                <p className="text-2xl font-bold">{formatCurrency(avgDailySpending)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold">
                  {goalProgress.filter(g => g.status === 'active').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{categorySpending.length}</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="spending" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="goals">Goal Progress</TabsTrigger>
          <TabsTrigger value="patterns">Spending Patterns</TabsTrigger>
        </TabsList>

        {/* Spending Analysis Tab */}
        <TabsContent value="spending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySpending.slice(0, 6).map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.category}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {formatCurrency(category.amount)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({category.count} transactions)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.percentage.toFixed(1)}% of total spending
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Spending Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Spending Trends</CardTitle>
                <CardDescription>Last 4 weeks comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {spendingTrends.map((trend, index) => (
                    <div key={trend.period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{trend.period}</p>
                        <p className="text-2xl font-bold">{formatCurrency(trend.amount)}</p>
                      </div>
                      {index > 0 && (
                        <div className={`flex items-center ${getChangeColor(trend.change)}`}>
                          {getChangeIcon(trend.change)}
                          <span className="ml-1 text-sm font-medium">
                            {Math.abs(trend.change) > 0 ? formatCurrency(Math.abs(trend.change)) : 'No change'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>Monthly financial overview for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {monthlyData.map((month) => (
                  <div key={month.month} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{month.month}</h4>
                      <Badge variant={month.net >= 0 ? "default" : "destructive"}>
                        Net: {formatCurrency(month.net)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Income</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(month.income)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.max(month.income, month.expenses) > 0 ? 
                                (month.income / Math.max(month.income, month.expenses)) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expenses</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(month.expenses)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.max(month.income, month.expenses) > 0 ? 
                                (month.expenses / Math.max(month.income, month.expenses)) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goal Progress Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalProgress.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Set</h3>
                <p className="text-gray-600">Create financial goals to track your progress here.</p>
              </div>
            ) : (
              goalProgress.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription>{goal.category}</CardDescription>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Progress</span>
                        <span className="font-medium">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            goal.progress_percentage >= 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {goal.progress_percentage.toFixed(1)}% complete
                        </span>
                        {goal.deadline && (
                          <span className="text-gray-600">
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Spending Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>Your biggest expense categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySpending.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600'][index]
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-gray-600">{category.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(category.amount)}</p>
                        <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Health Score */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Health Insights</CardTitle>
                <CardDescription>Key metrics about your financial habits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Savings Rate</span>
                      <span className="text-sm text-gray-600">
                        {monthlyData.length > 0 ? 
                          ((monthlyData[monthlyData.length - 1]?.net || 0) / 
                           Math.max(monthlyData[monthlyData.length - 1]?.income || 1, 1) * 100).toFixed(1)
                        : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${monthlyData.length > 0 ? 
                            Math.min(((monthlyData[monthlyData.length - 1]?.net || 0) / 
                            Math.max(monthlyData[monthlyData.length - 1]?.income || 1, 1) * 100), 100) 
                          : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Goal Completion Rate</span>
                      <span className="text-sm text-gray-600">
                        {goalProgress.length > 0 ? 
                          (goalProgress.filter(g => g.status === 'completed').length / goalProgress.length * 100).toFixed(1)
                        : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${goalProgress.length > 0 ? 
                            (goalProgress.filter(g => g.status === 'completed').length / goalProgress.length * 100)
                          : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Largest Category</p>
                        <p className="font-medium">
                          {categorySpending[0]?.category || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Most Active Month</p>
                        <p className="font-medium">
                          {monthlyData.reduce((max, month) => 
                            (month.income + month.expenses) > (max.income + max.expenses) ? month : max,
                            monthlyData[0] || { month: 'N/A', income: 0, expenses: 0, net: 0 }
                          ).month}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 