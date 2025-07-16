import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Edit, User, Mail, Phone, Building, MapPin, Loader2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'accountant' | 'consultant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  joinDate: string;
  businessCount: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  location?: string;
  totalRevenue?: number;
}

interface EditUserModalProps {
  user: User;
  onUserUpdated: () => void;
  trigger?: React.ReactNode;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onUserUpdated, trigger }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: user.name,
    email: user.email,
    phone: '', // We don't have phone in the user object, so start empty
    company: '', // We don't have company in the user object, so start empty
    address: user.location || '',
    role: user.role,
    status: user.status
  });

  React.useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        full_name: user.name,
        email: user.email,
        phone: '',
        company: '',
        address: user.location || '',
        role: user.role,
        status: user.status
      });
      setError(null);
    }
  }, [open, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.role || !formData.status) {
      setError('Please fill in all required fields');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const updateUser = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          address: formData.address || null,
          role: formData.role,
          // Note: status would typically be managed separately for security
          updated_at: new Date().toISOString(),
          metadata: {
            ...user,
            lastModifiedBy: 'admin',
            lastModifiedAt: new Date().toISOString()
          }
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setOpen(false);
      onUserUpdated();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === user.status) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: statusError } = await supabase
        .from('users')
        .update({
          // In a real app, you might have a separate status field
          metadata: {
            ...user,
            status: newStatus,
            statusChangedBy: 'admin',
            statusChangedAt: new Date().toISOString()
          }
        })
        .eq('id', user.id);

      if (statusError) throw statusError;

      setFormData(prev => ({ ...prev, status: newStatus as any }));
      onUserUpdated();
      
    } catch (error: any) {
      console.error('Error updating user status:', error);
      setError(error.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and account settings for {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
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
          
          <div className="grid grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="company"
                placeholder="Company name"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="address"
                placeholder="Business address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Quick Status Actions */}
          <div className="space-y-2">
            <Label>Quick Actions</Label>
            <div className="flex space-x-2">
              {user.status !== 'active' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  disabled={loading}
                >
                  Activate User
                </Button>
              )}
              {user.status !== 'suspended' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('suspended')}
                  disabled={loading}
                >
                  Suspend User
                </Button>
              )}
            </div>
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
            onClick={updateUser}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 