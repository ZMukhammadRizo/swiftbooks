import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Building, User, MapPin, DollarSign, Loader2 } from 'lucide-react';

interface Owner {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface AddBusinessModalProps {
  onBusinessAdded: () => void;
}

export const AddBusinessModal: React.FC<AddBusinessModalProps> = ({ onBusinessAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'retail',
    address: '',
    owner_id: '',
    monthly_fee: '29.99'
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
    }
  }, [open]);

  const loadOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data: ownersData, error: ownersError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('role', ['user', 'admin']) // Only users and admins can own businesses
        .order('full_name');

      if (ownersError) throw ownersError;
      
      setOwners(ownersData || []);
    } catch (error: any) {
      console.error('Error loading owners:', error);
      setError('Failed to load potential business owners');
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name || !formData.type || !formData.owner_id) {
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

  const createBusiness = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name,
          type: formData.type,
          address: formData.address || null,
          owner_id: formData.owner_id,
          monthly_fee: parseFloat(formData.monthly_fee)
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Create some sample transactions for the new business
      const sampleTransactions = [
        {
          business_id: newBusiness.id,
          type: 'income',
          amount: 1500.00,
          description: 'Initial revenue setup',
          category: 'Sales',
          date: new Date().toISOString().split('T')[0]
        },
        {
          business_id: newBusiness.id,
          type: 'expense',
          amount: 300.00,
          description: 'Office supplies',
          category: 'Office Expenses',
          date: new Date().toISOString().split('T')[0]
        }
      ];

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(sampleTransactions);

      if (transactionError) {
        console.warn('Failed to create sample transactions:', transactionError);
      }

      setOpen(false);
      setFormData({
        name: '',
        type: 'retail',
        address: '',
        owner_id: '',
        monthly_fee: '29.99'
      });
      onBusinessAdded();
      
    } catch (error: any) {
      console.error('Error creating business:', error);
      setError(error.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Business</DialogTitle>
          <DialogDescription>
            Create a new business record and assign it to a user
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="owner_id">Business Owner *</Label>
            <Select 
              value={formData.owner_id} 
              onValueChange={(value) => handleInputChange('owner_id', value)}
              disabled={loadingOwners}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOwners ? "Loading owners..." : "Select owner"} />
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
          
          {/* Business Preview */}
          {formData.name && formData.owner_id && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Business Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Type:</strong> {formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p><strong>Owner:</strong> {owners.find(o => o.id === formData.owner_id)?.full_name}</p>
                <p><strong>Monthly Fee:</strong> ${formData.monthly_fee}</p>
              </div>
            </div>
          )}
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
            onClick={createBusiness}
            disabled={loading || loadingOwners}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Business'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 