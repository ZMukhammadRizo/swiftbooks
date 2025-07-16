import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">User Management</h3>
        <p className="text-blue-700">
          Manage platform users, roles, permissions, and account settings.
        </p>
      </CardContent>
    </Card>
  );
}; 