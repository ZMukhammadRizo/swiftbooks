import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Shield, 
  Database,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalTransactions: number;
  totalTransactionValue: number;
  totalGoals: number;
  completedGoals: number;
  avgGoalProgress: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'transaction_added' | 'goal_created' | 'user_login';
  description: string;
  timestamp: string;
  user_email?: string;
}

interface UserGrowthData {
  period: string;
  users: number;
  change: number;
}

export const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    totalTransactions: 0,
    totalTransactionValue: 0,
    totalGoals: 0,
    completedGoals: 0,
    avgGoalProgress: 0,
    systemHealth: 'good'
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSystemData();
    }
  }, [user]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        usersResult,
        transactionsResult,
        goalsResult
      ] = await Promise.all([
        // Load all users
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Load all transactions
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Load all goals
        supabase
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (goalsResult.error) throw goalsResult.error;

      const users = usersResult.data || [];
      const transactions = transactionsResult.data || [];
      const goals = goalsResult.data || [];

      // Calculate system statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // User statistics
      const activeUsersCount = users.filter(u => u.last_sign_in_at).length;
      const newUsersToday = users.filter(u => new Date(u.created_at) >= today).length;
      const newUsersThisWeek = users.filter(u => new Date(u.created_at) >= thisWeek).length;

      // Transaction statistics
      const totalTransactionValue = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Goal statistics
      const completedGoalsCount = goals.filter(g => g.status === 'completed').length;
      const avgProgress = goals.length > 0 
        ? goals.reduce((sum, g) => sum + ((g.current_amount / g.target_amount) * 100), 0) / goals.length
        : 0;

      // System health calculation
      let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
      if (users.length > 100 && activeUsersCount > users.length * 0.8) {
        systemHealth = 'excellent';
      } else if (activeUsersCount < users.length * 0.3) {
        systemHealth = 'warning';
      } else if (activeUsersCount < users.length * 0.1) {
        systemHealth = 'critical';
      }

      const systemStats: SystemStats = {
        totalUsers: users.length,
        activeUsers: activeUsersCount,
        newUsersToday,
        newUsersThisWeek,
        totalTransactions: transactions.length,
        totalTransactionValue,
        totalGoals: goals.length,
        completedGoals: completedGoalsCount,
        avgGoalProgress: avgProgress,
        systemHealth
      };

      setStats(systemStats);

      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      // Add recent user registrations
      users.slice(0, 3).forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_created',
          description: `New user registered: ${user.email}`,
          timestamp: user.created_at,
          user_email: user.email
        });
      });

      // Add recent transactions
      transactions.slice(0, 3).forEach(transaction => {
        const user = users.find(u => u.id === transaction.user_id);
        activities.push({
          id: `transaction-${transaction.id}`,
          type: 'transaction_added',
          description: `Transaction added: $${Math.abs(transaction.amount).toFixed(2)} by ${user?.email || 'Unknown'}`,
          timestamp: transaction.created_at,
          user_email: user?.email
        });
      });

      // Add recent goals
      goals.slice(0, 2).forEach(goal => {
        const user = users.find(u => u.id === goal.user_id);
        activities.push({
          id: `goal-${goal.id}`,
          type: 'goal_created',
          description: `New goal created: ${goal.title} by ${user?.email || 'Unknown'}`,
          timestamp: goal.created_at,
          user_email: user?.email
        });
      });

      // Sort by timestamp and take most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));

      // Calculate user growth data for last 7 days
      const growthData: UserGrowthData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const usersOnDay = users.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= dayStart && createdAt < dayEnd;
        }).length;

        const prevDayUsers = i === 6 ? 0 : growthData[growthData.length - 1]?.users || 0;
        
        growthData.push({
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: usersOnDay,
          change: usersOnDay - prevDayUsers
        });
      }
      
      setUserGrowth(growthData);

    } catch (err: any) {
      console.error('Error loading system data:', err);
      setError('Failed to load system data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return <Users className="h-4 w-4 text-blue-600" />;
      case 'transaction_added': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'goal_created': return <Target className="h-4 w-4 text-purple-600" />;
      case 'user_login': return <UserCheck className="h-4 w-4 text-indigo-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
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
          {[...Array(8)].map((_, i) => (
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

      {/* System Health */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">System Health</h3>
              <p className="text-sm text-gray-600">Overall platform status</p>
            </div>
            <Badge className={getSystemHealthColor(stats.systemHealth)}>
              {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-green-600">+{stats.newUsersThisWeek} this week</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-xs text-gray-600">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(stats.totalTransactionValue)} total value
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Goals</p>
                <p className="text-2xl font-bold">{stats.totalGoals}</p>
                <p className="text-xs text-gray-600">
                  {stats.completedGoals} completed ({stats.avgGoalProgress.toFixed(1)}% avg progress)
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth (Last 7 Days)</CardTitle>
            <CardDescription>Daily new user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userGrowth.map((day, index) => (
                <div key={day.period} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.period}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{day.users}</span>
                    {index > 0 && (
                      <span className={`text-xs flex items-center ${
                        day.change > 0 ? 'text-green-600' : day.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {day.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : day.change < 0 ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : null}
                        {day.change !== 0 && Math.abs(day.change)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activity and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Users:</span>
                <span className="font-medium">{stats.newUsersToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">System Status:</span>
                <Badge variant="outline" className={getSystemHealthColor(stats.systemHealth)}>
                  {stats.systemHealth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Data Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users:</span>
                <span className="font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions:</span>
                <span className="font-medium">{stats.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Goals:</span>
                <span className="font-medium">{stats.totalGoals}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User Engagement:</span>
                <span className="font-medium">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Goal Completion:</span>
                <span className="font-medium">
                  {stats.totalGoals > 0 ? ((stats.completedGoals / stats.totalGoals) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 