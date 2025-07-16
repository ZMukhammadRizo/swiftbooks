import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const AdminSystem: React.FC = () => {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-8 text-center">
        <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">System Configuration</h3>
        <p className="text-gray-700">
          System settings, configuration management, and platform monitoring tools.
        </p>
      </CardContent>
    </Card>
  );
}; 