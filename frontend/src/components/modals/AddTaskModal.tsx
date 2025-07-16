import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ClipboardList,
  User
} from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface TaskFormData {
  title: string;
  description: string;
  clientId: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'review' | 'report' | 'meeting' | 'tax_filing';
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    clientId: '',
    dueDate: '',
    priority: 'medium',
    type: 'review'
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name as name, email')
        .eq('role', 'user')
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientId || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find selected client
      const selectedClient = clients.find(c => c.id === formData.clientId);
      
      // Create task record
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: formData.title,
          description: formData.description,
          client_id: formData.clientId,
          client_name: selectedClient?.name || 'Unknown Client',
          due_date: formData.dueDate,
          priority: formData.priority,
          type: formData.type,
          status: 'pending',
          created_by: user?.id
        });

      if (taskError) {
        throw new Error(`Failed to create task: ${taskError.message}`);
      }

      setSuccess(`Task "${formData.title}" created successfully!`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        clientId: '',
        dueDate: '',
        priority: 'medium',
        type: 'review'
      });

      // Notify parent component
      onTaskAdded();

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Task</span>
          </DialogTitle>
          <DialogDescription>
            Create a new task for client management.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Review monthly financials"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional details about the task..."
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="clientId">Client *</Label>
            <select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Task Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as any)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="review">Review</option>
                <option value="report">Report</option>
                <option value="meeting">Meeting</option>
                <option value="tax_filing">Tax Filing</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as any)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 