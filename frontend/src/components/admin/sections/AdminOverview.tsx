import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-8 text-center">
        <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">System Overview</h3>
        <p className="text-red-700">
          System metrics, user analytics, and platform health monitoring dashboard.
        </p>
      </CardContent>
    </Card>
  );
}; 