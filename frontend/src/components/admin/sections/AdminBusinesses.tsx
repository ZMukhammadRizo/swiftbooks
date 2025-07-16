import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';

export const AdminBusinesses: React.FC = () => {
  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-8 text-center">
        <Building className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Business Management</h3>
        <p className="text-green-700">
          Monitor and manage all businesses on the platform with detailed analytics.
        </p>
      </CardContent>
    </Card>
  );
}; 