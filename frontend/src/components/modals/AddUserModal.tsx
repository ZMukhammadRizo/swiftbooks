import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, User, Mail, Phone, Building, MapPin, Loader2 } from 'lucide-react';

interface AddUserModalProps {
  onUserAdded: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'client' as 'client' | 'accountant' | 'admin'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const createUser = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Create user in auth.users (this is a demo - in production you'd use admin API)
      console.log('Demo: Creating user with auth service...');
      
      // For demo purposes, we'll create the user directly in public.users table
      // In production, you'd use Supabase Admin API or server-side function
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          role: formData.role,
          metadata: {
            createdBy: 'admin',
            createdAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (userError) throw userError;

      // If role is client, create a demo business for them
      if (formData.role === 'client') {
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            name: `${formData.email.split('@')[0]}'s Business`,
            type: 'retail',
            owner_id: newUser.id,
            monthly_fee: 29.99
          });

        if (businessError) {
          console.warn('Failed to create demo business:', businessError);
        }
      }

      setOpen(false);
      setFormData({
        email: '',
        password: '',
        role: 'client'
      });
      onUserAdded();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(`Failed to create user: Database error creating new user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with role-based access to the platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={createUser}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 