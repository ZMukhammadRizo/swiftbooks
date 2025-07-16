import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  User,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone,
  Building,
  DollarSign
} from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  monthlyFee: string;
  businessName: string;
  businessType: string;
  address: string;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onClientAdded
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    monthlyFee: '',
    businessName: '',
    businessType: 'retail',
    address: ''
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.businessName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Note: In production, actual user creation would be handled server-side
      // For demo purposes, we'll create a mock user record
      const mockUserId = crypto.randomUUID();

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: mockUserId,
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          role: 'user'
        });

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Create business for the client
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.businessName,
          type: formData.businessType,
          address: formData.address,
          owner_id: mockUserId,
          monthly_fee: parseFloat(formData.monthlyFee) || 0
        })
        .select()
        .single();

      if (businessError) {
        throw new Error(`Failed to create business: ${businessError.message}`);
      }

      // Create some initial sample data for the business
      const sampleTransactions = [
        {
          business_id: businessData.id,
          type: 'income',
          amount: 5000,
          description: 'Initial revenue',
          category: 'sales',
          date: new Date().toISOString().split('T')[0]
        },
        {
          business_id: businessData.id,
          type: 'expense',
          amount: 1500,
          description: 'Office expenses',
          category: 'office',
          date: new Date().toISOString().split('T')[0]
        }
      ];

      await supabase.from('transactions').insert(sampleTransactions);

      setSuccess(`Client "${formData.name}" added successfully! (Note: In production, login credentials would be sent via email.)`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        monthlyFee: '',
        businessName: '',
        businessType: 'retail',
        address: ''
      });

      // Notify parent component
      onClientAdded();

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error adding client:', err);
      setError(err.message || 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Client</span>
          </DialogTitle>
          <DialogDescription>
            Create a new client account and business profile.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Client Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="ABC Corp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="My Business LLC"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="retail">Retail</option>
                    <option value="service">Service</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="technology">Technology</option>
                    <option value="consulting">Consulting</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyFee">Monthly Service Fee ($)</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyFee}
                    onChange={(e) => handleInputChange('monthlyFee', e.target.value)}
                    placeholder="500.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 