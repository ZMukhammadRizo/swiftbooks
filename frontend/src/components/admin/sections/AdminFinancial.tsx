import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export const AdminFinancial: React.FC = () => {
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardContent className="p-8 text-center">
        <DollarSign className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Financial Analytics</h3>
        <p className="text-yellow-700">
          Platform revenue analytics, subscription metrics, and financial reporting.
        </p>
      </CardContent>
    </Card>
  );
}; 