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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Target, 
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Trash,
  CheckCircle,
  PiggyBank
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
}

interface GoalFormData {
  title: string;
  description: string;
  target_amount: string;
  current_amount: string;
  deadline: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export const UserGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddMoneyForm, setShowAddMoneyForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    category: '',
    priority: 'medium'
  });

  const [addMoneyAmount, setAddMoneyAmount] = useState<string>('');

  const categories = [
    'Emergency Fund', 'Vacation', 'Car', 'House', 'Education',
    'Investment', 'Debt Payoff', 'Retirement', 'Technology', 'Other'
  ];

  // Load user's financial goals
  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGoals = (data || []).map(g => ({
        id: g.id,
        title: g.title,
        description: g.description || '',
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount || 0),
        deadline: g.deadline,
        category: g.category,
        priority: g.priority as 'low' | 'medium' | 'high',
        status: g.status as 'active' | 'completed' | 'paused'
      }));

      setGoals(formattedGoals);

    } catch (err: any) {
      console.error('Error loading goals:', err);
      setError(err.message || 'Failed to load financial goals');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: '',
      current_amount: '0',
      deadline: '',
      category: '',
      priority: 'medium'
    });
  };

  const handleCreateGoal = async () => {
    if (!user?.id) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (!formData.title.trim()) {
        throw new Error('Goal title is required');
      }
      if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
        throw new Error('Target amount must be greater than 0');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }

      const goalData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        deadline: formData.deadline || null,
        category: formData.category,
        priority: formData.priority,
        status: 'active'
      };

      const { error } = await supabase
        .from('financial_goals')
        .insert([goalData]);

      if (error) throw error;

      await loadGoals();
      setShowAddForm(false);
      resetForm();

    } catch (err: any) {
      console.error('Error creating goal:', err);
      setError(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline || '',
      category: goal.category,
      priority: goal.priority
    });
    setShowEditForm(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !user?.id) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (!formData.title.trim()) {
        throw new Error('Goal title is required');
      }
      if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
        throw new Error('Target amount must be greater than 0');
      }

      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        deadline: formData.deadline || null,
        category: formData.category,
        priority: formData.priority
      };

      const { error } = await supabase
        .from('financial_goals')
        .update(goalData)
        .eq('id', editingGoal.id);

      if (error) throw error;

      await loadGoals();
      setShowEditForm(false);
      setEditingGoal(null);
      resetForm();

    } catch (err: any) {
      console.error('Error updating goal:', err);
      setError(err.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      await loadGoals();

    } catch (err: any) {
      console.error('Error deleting goal:', err);
      setError(err.message || 'Failed to delete goal');
    }
  };

  const handleAddMoney = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setAddMoneyAmount('');
    setShowAddMoneyForm(true);
  };

  const handleConfirmAddMoney = async () => {
    if (!selectedGoal || !addMoneyAmount) return;

    try {
      setSubmitting(true);
      setError(null);

      const amount = parseFloat(addMoneyAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const newCurrentAmount = selectedGoal.current_amount + amount;

      const { error } = await supabase
        .from('financial_goals')
        .update({ current_amount: newCurrentAmount })
        .eq('id', selectedGoal.id);

      if (error) throw error;

      await loadGoals();
      setShowAddMoneyForm(false);
      setSelectedGoal(null);
      setAddMoneyAmount('');

    } catch (err: any) {
      console.error('Error adding money:', err);
      setError(err.message || 'Failed to add money to goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (goalId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('financial_goals')
        .update({ status: 'completed' })
        .eq('id', goalId);

      if (error) throw error;

      await loadGoals();

    } catch (err: any) {
      console.error('Error marking goal complete:', err);
      setError(err.message || 'Failed to mark goal as complete');
    }
  };

  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgress = (goal: FinancialGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalTargetAmount = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600">Track your savings and financial milestones</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              Goals in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalTargetAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined goal amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalTargetAmount > 0 ? Math.round((totalCurrentAmount / totalTargetAmount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalCurrentAmount)} saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Goals</CardTitle>
          <CardDescription>View goals by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label>Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setSelectedCategory('all')}
            >
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {goals.length === 0 ? 'No financial goals yet' : 'No goals match your filter'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {goals.length === 0 
                    ? 'Set your first financial goal to start tracking your progress'
                    : 'Try selecting a different category or clear the filter'}
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = getProgress(goal);
            const daysLeft = getDaysUntilDeadline(goal.deadline);
            
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription className="mt-1">
                          {goal.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge variant="outline">{goal.category}</Badge>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority} priority
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Amount Details */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(goal.current_amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        of {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-600">
                        {formatCurrency(goal.target_amount - goal.current_amount)}
                      </p>
                      <p className="text-sm text-gray-500">remaining</p>
                    </div>
                  </div>

                  {/* Deadline */}
                  {goal.deadline && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Due {formatDate(goal.deadline)}
                      </span>
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={`font-medium ${
                          daysLeft <= 30 ? 'text-red-600' : 
                          daysLeft <= 90 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          ({daysLeft} days left)
                        </span>
                      )}
                      {daysLeft !== null && daysLeft < 0 && (
                        <span className="font-medium text-red-600">
                          (Overdue by {Math.abs(daysLeft)} days)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    {goal.status === 'active' && progress < 100 && (
                      <Button size="sm" className="flex-1" onClick={() => handleAddMoney(goal)}>
                        <PiggyBank className="h-4 w-4 mr-2" />
                        Add Money
                      </Button>
                    )}
                    {progress >= 100 && goal.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkComplete(goal.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Goal Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Financial Goal</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your goal"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount *</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current">Current Amount</Label>
                <Input
                  id="current"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Target Date</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Form Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Financial Goal</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Goal Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your goal"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target">Target Amount *</Label>
                <Input
                  id="edit-target"
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-current">Current Amount</Label>
                <Input
                  id="edit-current"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Target Date</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditForm(false); setEditingGoal(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Money Modal */}
      <Dialog open={showAddMoneyForm} onOpenChange={setShowAddMoneyForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Money to Goal</DialogTitle>
          </DialogHeader>
          
          {selectedGoal && (
            <>
              <div className="text-center py-4">
                <h3 className="text-lg font-medium">{selectedGoal.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Current: {formatCurrency(selectedGoal.current_amount)} of {formatCurrency(selectedGoal.target_amount)}
                </p>
                <Progress 
                  value={getProgress(selectedGoal)} 
                  className="h-2 mt-3" 
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-amount">Amount to Add</Label>
                  <Input
                    id="add-amount"
                    type="number"
                    step="0.01"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowAddMoneyForm(false); setSelectedGoal(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmAddMoney} disabled={submitting || !addMoneyAmount}>
                  {submitting ? 'Adding...' : 'Add Money'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 