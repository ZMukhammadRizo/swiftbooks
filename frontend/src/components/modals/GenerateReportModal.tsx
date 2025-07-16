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
  FileText,
  Calendar,
  Building
} from 'lucide-react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
  businesses: Business[];
}

interface Business {
  id: string;
  name: string;
  type: string;
}

interface ReportFormData {
  title: string;
  clientId: string;
  businessId: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'tax_summary';
  dueDate: string;
  period: string;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  onReportGenerated
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientBusinesses, setSelectedClientBusinesses] = useState<Business[]>([]);
  
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    clientId: '',
    businessId: '',
    type: 'profit_loss',
    dueDate: '',
    period: 'monthly'
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  useEffect(() => {
    // Update title when type changes
    const typeNames = {
      profit_loss: 'Profit & Loss Report',
      balance_sheet: 'Balance Sheet',
      cash_flow: 'Cash Flow Statement',
      tax_summary: 'Tax Summary Report'
    };
    
    setFormData(prev => ({
      ...prev,
      title: typeNames[prev.type] || ''
    }));
  }, [formData.type]);

  useEffect(() => {
    // Update available businesses when client changes
    const selectedClient = clients.find(c => c.id === formData.clientId);
    setSelectedClientBusinesses(selectedClient?.businesses || []);
    setFormData(prev => ({ ...prev, businessId: '' }));
  }, [formData.clientId, clients]);

  const loadClients = async () => {
    try {
      // Load clients with their businesses
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('id, full_name as name, email')
        .eq('role', 'user')
        .order('full_name');

      if (clientError) throw clientError;

      // Load businesses for each client
      const clientsWithBusinesses = await Promise.all(
        (clientData || []).map(async (client) => {
          const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('id, name, type')
            .eq('owner_id', client.id);

          return {
            ...client,
            businesses: businesses || []
          };
        })
      );

      setClients(clientsWithBusinesses);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const handleInputChange = (field: keyof ReportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientId || !formData.businessId || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find selected client and business
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const selectedBusiness = selectedClientBusinesses.find(b => b.id === formData.businessId);
      
      // Create report record
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          title: formData.title,
          client_id: formData.clientId,
          client_name: selectedClient?.name || 'Unknown Client',
          business_id: formData.businessId,
          business_name: selectedBusiness?.name || 'Unknown Business',
          type: formData.type,
          due_date: formData.dueDate,
          period: formData.period,
          status: 'draft',
          created_by: user?.id
        });

      if (reportError) {
        throw new Error(`Failed to create report: ${reportError.message}`);
      }

      setSuccess(`Report "${formData.title}" created successfully!`);
      
      // Reset form
      setFormData({
        title: '',
        clientId: '',
        businessId: '',
        type: 'profit_loss',
        dueDate: '',
        period: 'monthly'
      });

      // Notify parent component
      onReportGenerated();

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
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
            <FileText className="h-5 w-5" />
            <span>Generate Report</span>
          </DialogTitle>
          <DialogDescription>
            Create a new financial report for a client.
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
            <Label htmlFor="type">Report Type *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as any)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="profit_loss">Profit & Loss Statement</option>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="cash_flow">Cash Flow Statement</option>
              <option value="tax_summary">Tax Summary Report</option>
            </select>
          </div>

          <div>
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Monthly Profit & Loss Report"
              required
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

          <div>
            <Label htmlFor="businessId">Business *</Label>
            <select
              id="businessId"
              value={formData.businessId}
              onChange={(e) => handleInputChange('businessId', e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.clientId}
            >
              <option value="">Select a business</option>
              {selectedClientBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({business.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Report Period</Label>
              <select
                id="period"
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
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
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 