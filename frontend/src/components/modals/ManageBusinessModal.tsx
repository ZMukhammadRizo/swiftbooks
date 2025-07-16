import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Edit, Building, User, MapPin, DollarSign, Loader2, Trash2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  createdDate: string;
  revenue: number;
  employeeCount?: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  lastActivity: string;
  transactionCount: number;
}

interface Owner {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ManageBusinessModalProps {
  business: Business;
  onBusinessUpdated: () => void;
  trigger?: React.ReactNode;
}

export const ManageBusinessModal: React.FC<ManageBusinessModalProps> = ({ business, onBusinessUpdated, trigger }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  
  const [formData, setFormData] = useState({
    name: business.name,
    type: business.industry,
    address: '',
    owner_id: '',
    monthly_fee: '29.99',
    status: business.status
  });

  const businessTypes = [
    'retail',
    'restaurant',
    'consulting',
    'technology',
    'healthcare',
    'real_estate',
    'manufacturing',
    'service',
    'e_commerce',
    'other'
  ];

  useEffect(() => {
    if (open) {
      loadOwners();
      // Reset form data when modal opens
      setFormData({
        name: business.name,
        type: business.industry,
        address: '',
        owner_id: '',
        monthly_fee: '29.99',
        status: business.status
      });
      setError(null);
    }
  }, [open, business]);

  const loadOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data: ownersData, error: ownersError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('role', ['user', 'admin'])
        .order('full_name');

      if (ownersError) throw ownersError;
      
      setOwners(ownersData || []);
      
      // Set current owner if found
      const currentOwner = ownersData?.find(owner => owner.email === business.ownerEmail);
      if (currentOwner) {
        setFormData(prev => ({ ...prev, owner_id: currentOwner.id }));
      }
    } catch (error: any) {
      console.error('Error loading owners:', error);
      setError('Failed to load business owners');
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name || !formData.type) {
      setError('Please fill in all required fields');
      return false;
    }
    
    const monthlyFee = parseFloat(formData.monthly_fee);
    if (isNaN(monthlyFee) || monthlyFee < 0) {
      setError('Monthly fee must be a valid number');
      return false;
    }
    
    return true;
  };

  const updateBusiness = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        name: formData.name,
        type: formData.type,
        address: formData.address || null,
        monthly_fee: parseFloat(formData.monthly_fee),
        updated_at: new Date().toISOString()
      };

      // Only update owner if a new one is selected
      if (formData.owner_id) {
        updateData.owner_id = formData.owner_id;
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business.id);

      if (updateError) throw updateError;

      setOpen(false);
      onBusinessUpdated();
      
    } catch (error: any) {
      console.error('Error updating business:', error);
      setError(error.message || 'Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === business.status) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: statusError } = await supabase
        .from('businesses')
        .update({
          // In a real app, you might have a separate status field
          metadata: {
            status: newStatus,
            statusChangedBy: 'admin',
            statusChangedAt: new Date().toISOString()
          }
        })
        .eq('id', business.id);

      if (statusError) throw statusError;

      setFormData(prev => ({ ...prev, status: newStatus as any }));
      onBusinessUpdated();
      
    } catch (error: any) {
      console.error('Error updating business status:', error);
      setError(error.message || 'Failed to update business status');
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async () => {
    if (!confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Delete related transactions first (cascade should handle this, but being explicit)
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('business_id', business.id);

      if (transactionsError) {
        console.warn('Error deleting transactions:', transactionsError);
      }

      // Delete the business
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id);

      if (deleteError) throw deleteError;

      setOpen(false);
      onBusinessUpdated();
      
    } catch (error: any) {
      console.error('Error deleting business:', error);
      setError(error.message || 'Failed to delete business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Manage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Business</DialogTitle>
          <DialogDescription>
            Update business information and settings for {business.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Business Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Monthly Fee</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="monthly_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  value={formData.monthly_fee}
                  onChange={(e) => handleInputChange('monthly_fee', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner_id">Change Owner</Label>
              <Select 
                value={formData.owner_id} 
                onValueChange={(value) => handleInputChange('owner_id', value)}
                disabled={loadingOwners}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingOwners ? "Loading..." : "Select new owner"} />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{owner.full_name}</span>
                        <span className="text-sm text-gray-500">({owner.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="address"
                placeholder="123 Business St, City, State 12345"
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
              {business.status !== 'active' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  disabled={loading}
                >
                  Activate Business
                </Button>
              )}
              {business.status !== 'suspended' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('suspended')}
                  disabled={loading}
                >
                  Suspend Business
                </Button>
              )}
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="border-t pt-4 space-y-2">
            <Label className="text-red-600">Danger Zone</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteBusiness}
              disabled={loading}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Business
            </Button>
            <p className="text-xs text-gray-500">
              This will permanently delete the business and all associated data.
            </p>
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
            onClick={updateBusiness}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Business'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 