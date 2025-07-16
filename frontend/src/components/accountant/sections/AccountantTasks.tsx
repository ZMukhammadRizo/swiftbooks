import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';

// Interface definitions
interface Task {
  id: string;
  title: string;
  description: string;
  type: 'review' | 'filing' | 'consultation' | 'analysis' | 'meeting' | 'report' | 'compliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  client_id?: string;
  client_name?: string;
  assigned_to?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

const taskTypes = [
  { value: 'review', label: 'Review', color: 'blue' },
  { value: 'filing', label: 'Tax Filing', color: 'purple' },
  { value: 'consultation', label: 'Consultation', color: 'green' },
  { value: 'analysis', label: 'Analysis', color: 'orange' },
  { value: 'meeting', label: 'Meeting', color: 'teal' },
  { value: 'report', label: 'Report', color: 'indigo' },
  { value: 'compliance', label: 'Compliance', color: 'red' },
  { value: 'other', label: 'Other', color: 'gray' }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'gray', icon: ArrowDown },
  { value: 'medium', label: 'Medium', color: 'yellow', icon: Minus },
  { value: 'high', label: 'High', color: 'orange', icon: ArrowUp },
  { value: 'urgent', label: 'Urgent', color: 'red', icon: Zap }
];

export const AccountantTasks: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  
  // Modal states
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'review' as Task['type'],
    priority: 'medium' as Task['priority'],
    client_id: '',
    due_date: ''
  });

  // Load data
  useEffect(() => {
    loadTasksAndClients();
  }, []);

  // Filter tasks
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(task => task.type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(task => task.client_id === clientFilter);
    }

    // Sort by priority and due date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, typeFilter, priorityFilter, clientFilter]);

  const loadTasksAndClients = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadTasks(),
        loadClients()
      ]);

    } catch (err: any) {
      console.error('Error loading tasks and clients:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      // For now, we'll generate demo tasks since we don't have a tasks table yet
      // In a real implementation, this would query a tasks table
      const demoTasks: Task[] = [
        {
          id: '1',
          title: 'Review Q3 Financial Statements',
          description: 'Complete review of quarterly financial statements and prepare recommendations',
          type: 'review',
          priority: 'high',
          status: 'pending',
          client_id: 'client-1',
          client_name: 'Tech Startup LLC',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Tax Filing for Real Estate Business',
          description: 'Prepare and file annual tax returns for real estate investment business',
          type: 'filing',
          priority: 'urgent',
          status: 'in_progress',
          client_id: 'client-2',
          client_name: 'Real Estate Pro',
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Monthly Consultation Meeting',
          description: 'Scheduled consultation to discuss financial strategy and planning',
          type: 'consultation',
          priority: 'medium',
          status: 'pending',
          client_id: 'client-3',
          client_name: 'Small Business Inc',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Expense Report Analysis',
          description: 'Analyze expense patterns and identify cost optimization opportunities',
          type: 'analysis',
          priority: 'low',
          status: 'completed',
          client_id: 'client-1',
          client_name: 'Tech Startup LLC',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          title: 'Compliance Check',
          description: 'Quarterly compliance review for regulatory requirements',
          type: 'compliance',
          priority: 'high',
          status: 'pending',
          client_id: 'client-2',
          client_name: 'Real Estate Pro',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setTasks(demoTasks);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      throw err;
    }
  };

  const loadClients = async () => {
    try {
      const { data: clientUsers, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'user')
        .order('email');

      if (error) throw error;

      const transformedClients: Client[] = (clientUsers || []).map(user => ({
        id: user.id,
        name: user.email.split('@')[0] || user.email,
        email: user.email
      }));

      setClients(transformedClients);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      throw err;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasksAndClients();
    setRefreshing(false);
  };

  const handleAddTask = async () => {
    try {
      // In a real implementation, this would create a task in the database
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskForm,
        status: 'pending',
        client_name: clients.find(c => c.id === taskForm.client_id)?.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTasks([newTask, ...tasks]);
      setShowAddTaskModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message || 'Failed to add task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
            }
          : task
      );
      setTasks(updatedTasks);
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      type: 'review',
      priority: 'medium',
      client_id: '',
      due_date: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const typeConfig = taskTypes.find(t => t.value === type);
    const color = typeConfig?.color || 'gray';
    return `bg-${color}-100 text-${color}-800`;
  };

  const getPriorityIcon = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    const Icon = priorityConfig?.icon || Minus;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600">Track and manage client-related tasks</p>
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
          <Button onClick={() => setShowAddTaskModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {taskTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
          <CardDescription>
            Manage all client tasks and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all'
                  ? 'No tasks match your filters' 
                  : 'No tasks found'}
              </p>
              <p className="text-sm text-gray-400">
                {tasks.length === 0 
                  ? 'Create your first task to get started'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task.due_date, task.status);
                const daysUntilDue = getDaysUntilDue(task.due_date);
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      overdue 
                        ? 'border-l-red-500 bg-red-50' 
                        : task.priority === 'urgent' 
                          ? 'border-l-red-400 bg-red-50' 
                          : task.priority === 'high'
                            ? 'border-l-orange-400 bg-orange-50'
                            : 'border-l-blue-400 bg-gray-50'
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {overdue && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityIcon(task.priority)}
                            <span className="ml-1">{task.priority}</span>
                          </Badge>
                          <Badge variant="outline">
                            {taskTypes.find(t => t.value === task.type)?.label}
                          </Badge>
                          {task.client_name && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {task.client_name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Due: {formatDate(task.due_date)}
                            {daysUntilDue >= 0 && task.status !== 'completed' && (
                              <span className={daysUntilDue <= 1 ? 'text-red-600 font-medium' : ''}>
                                {' '}({daysUntilDue === 0 ? 'Today' : daysUntilDue === 1 ? 'Tomorrow' : `${daysUntilDue} days`})
                              </span>
                            )}
                          </span>
                          <span>Created: {formatDate(task.created_at)}</span>
                          {task.completed_at && (
                            <span>Completed: {formatDate(task.completed_at)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-4">
                        {task.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {task.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Modal */}
      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add New Task</span>
            </DialogTitle>
            <DialogDescription>
              Create a new task for client management
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={taskForm.type} onValueChange={(value: Task['type']) => setTaskForm({...taskForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <Select value={taskForm.priority} onValueChange={(value: Task['priority']) => setTaskForm({...taskForm, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Client</label>
                <Select value={taskForm.client_id} onValueChange={(value) => setTaskForm({...taskForm, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <Input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddTaskModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTask}
              disabled={!taskForm.title || !taskForm.description || !taskForm.due_date}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 