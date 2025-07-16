import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Clock,
  Target,
  MessageSquare,
  BarChart3,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ConsultationSession {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'budget_review' | 'goal_setting' | 'investment_advice' | 'debt_management';
  notes?: string;
}

interface ClientMetrics {
  id: string;
  name: string;
  totalRevenue: number;
  monthlyExpenses: number;
  savingsRate: number;
  goalProgress: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastConsultation: string;
}

export const ConsultantOverview: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [clients, setClients] = useState<ClientMetrics[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ConsultationSession[]>([]);
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    completedSessions: 0,
    avgClientProgress: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load clients assigned to this consultant
      await Promise.all([
        loadClients(),
        loadUpcomingSessions(),
        calculateMetrics()
      ]);
    } catch (err: any) {
      console.error('Error loading consultant dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    // For now, create mock data since we don't have consultant-client relationships in DB yet
    const mockClients: ClientMetrics[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        totalRevenue: 85000,
        monthlyExpenses: 4200,
        savingsRate: 22,
        goalProgress: 78,
        riskLevel: 'low',
        lastConsultation: '2024-01-15'
      },
      {
        id: '2', 
        name: 'Michael Chen',
        totalRevenue: 120000,
        monthlyExpenses: 6800,
        savingsRate: 18,
        goalProgress: 65,
        riskLevel: 'medium',
        lastConsultation: '2024-01-12'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        totalRevenue: 45000,
        monthlyExpenses: 3100,
        savingsRate: 15,
        goalProgress: 42,
        riskLevel: 'high',
        lastConsultation: '2024-01-10'
      }
    ];
    setClients(mockClients);
  };

  const loadUpcomingSessions = async () => {
    // Mock upcoming consultation sessions
    const mockSessions: ConsultationSession[] = [
      {
        id: '1',
        clientName: 'Sarah Johnson',
        date: '2024-01-18',
        time: '10:00 AM',
        status: 'scheduled',
        type: 'budget_review'
      },
      {
        id: '2',
        clientName: 'Michael Chen', 
        date: '2024-01-18',
        time: '2:00 PM',
        status: 'scheduled',
        type: 'investment_advice'
      },
      {
        id: '3',
        clientName: 'Emily Rodriguez',
        date: '2024-01-19',
        time: '11:00 AM',
        status: 'scheduled',
        type: 'debt_management'
      }
    ];
    setUpcomingSessions(mockSessions);
  };

  const calculateMetrics = () => {
    setMetrics({
      totalClients: 12,
      activeClients: 9,
      completedSessions: 45,
      avgClientProgress: 68,
      monthlyRevenue: 8500
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSessionTypeLabel = (type: string) => {
    const labels = {
      budget_review: 'Budget Review',
      goal_setting: 'Goal Setting',
      investment_advice: 'Investment Advice',
      debt_management: 'Debt Management'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consultant Dashboard</h2>
          <p className="text-gray-600">Manage your clients and consultations</p>
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-green-600">{metrics.activeClients}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions This Month</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.completedSessions}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.avgClientProgress}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.monthlyRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Client Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <Badge className={getRiskColor(client.riskLevel)}>
                        {client.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Savings: {client.savingsRate}%</span>
                      <span>Progress: {client.goalProgress}%</span>
                      <span>Revenue: {formatCurrency(client.totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{session.clientName}</p>
                      <Badge variant="outline">
                        {getSessionTypeLabel(session.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {session.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {session.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 