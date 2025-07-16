import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Download, FileText, Database, Loader2 } from 'lucide-react';

interface ExportBusinessModalProps {
  businesses: any[];
}

export const ExportBusinessModal: React.FC<ExportBusinessModalProps> = ({ businesses }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const exportToCSV = (data: any[]) => {
    const headers = [
      'Business Name',
      'Owner',
      'Owner Email',
      'Industry',
      'Status',
      'Revenue',
      'Transaction Count',
      'Created Date',
      'Last Activity'
    ];

    const csvData = data.map(business => [
      business.name,
      business.owner,
      business.ownerEmail,
      business.industry,
      business.status,
      business.revenue,
      business.transactionCount,
      formatDate(business.createdDate),
      formatDate(business.lastActivity)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `businesses-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[]) => {
    const exportData = {
      export_date: new Date().toISOString(),
      total_businesses: data.length,
      businesses: data.map(business => ({
        id: business.id,
        name: business.name,
        owner: {
          name: business.owner,
          email: business.ownerEmail
        },
        details: {
          industry: business.industry,
          status: business.status,
          revenue: business.revenue,
          transaction_count: business.transactionCount,
          employee_count: business.employeeCount || 1,
          subscription: business.subscription
        },
        dates: {
          created: business.createdDate,
          last_activity: business.lastActivity
        }
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `businesses-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data: any[]) => {
    // For PDF export, we'll create a simple text-based report
    const reportContent = `
SWIFTBOOKS BUSINESS EXPORT REPORT
Generated: ${new Date().toLocaleString()}
Total Businesses: ${data.length}

${'='.repeat(60)}

${data.map((business, index) => `
BUSINESS #${index + 1}
${'-'.repeat(30)}
Name: ${business.name}
Owner: ${business.owner} (${business.ownerEmail})
Industry: ${business.industry}
Status: ${business.status.toUpperCase()}
Revenue: ${formatCurrency(business.revenue)}
Transactions: ${business.transactionCount}
Employees: ${business.employeeCount || 1}
Created: ${formatDate(business.createdDate)}
Last Activity: ${formatDate(business.lastActivity)}
${business.subscription ? `Subscription: ${business.subscription.toUpperCase()} plan` : ''}
`).join('\n')}

${'='.repeat(60)}
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `businesses-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      switch (exportFormat) {
        case 'csv':
          exportToCSV(businesses);
          break;
        case 'json':
          exportToJSON(businesses);
          break;
        case 'pdf':
          exportToPDF(businesses);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      setOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <Database className="h-4 w-4 text-green-600" />;
      case 'json':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv':
        return 'Comma-separated values, compatible with Excel and spreadsheet applications';
      case 'json':
        return 'Structured data format, ideal for developers and data processing';
      case 'pdf':
        return 'Formatted text report, suitable for documentation and sharing';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Business Data</DialogTitle>
          <DialogDescription>
            Export {businesses.length} business{businesses.length !== 1 ? 'es' : ''} in your preferred format
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span>CSV (Spreadsheet)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>JSON (Data)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span>Text Report</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {getFormatIcon(exportFormat)}
                <span className="text-sm font-medium">
                  {exportFormat.toUpperCase()} Format
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {getFormatDescription(exportFormat)}
              </p>
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Export Preview</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• {businesses.length} business records</p>
              <p>• Business details (name, owner, industry, status)</p>
              <p>• Financial data (revenue, transaction count)</p>
              <p>• Activity timestamps and metadata</p>
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
            onClick={handleExport}
            disabled={loading || businesses.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 