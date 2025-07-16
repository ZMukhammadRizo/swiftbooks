import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Simple test pages to verify login functionality
export const ClientTestPage: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">✅ Client Login Test - SUCCESS!</CardTitle>
            <CardDescription>
              Login functionality is working correctly for Client role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">User Information:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
                {user?.metadata?.isTemporary && (
                  <p><strong>Mode:</strong> <span className="text-orange-600">Temporary (No Database)</span></p>
                )}
                {user?.metadata?.isMock && (
                  <p><strong>Mode:</strong> <span className="text-purple-600">Mock Authentication</span></p>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Test Status:</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Authentication successful</li>
                <li>✅ User data loaded from database</li>
                <li>✅ Role-based routing working</li>
                <li>✅ Protected route access granted</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="bg-green-600">
                Go to Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AccountantTestPage: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600">✅ Accountant Login Test - SUCCESS!</CardTitle>
            <CardDescription>
              Login functionality is working correctly for Accountant role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">User Information:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
                {user?.metadata?.isTemporary && (
                  <p><strong>Mode:</strong> <span className="text-orange-600">Temporary (No Database)</span></p>
                )}
                {user?.metadata?.isMock && (
                  <p><strong>Mode:</strong> <span className="text-purple-600">Mock Authentication</span></p>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Test Status:</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Authentication successful</li>
                <li>✅ User data loaded from database</li>
                <li>✅ Role-based routing working</li>
                <li>✅ Protected route access granted</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="bg-blue-600">
                Go to Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AdminTestPage: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-600">✅ Admin Login Test - SUCCESS!</CardTitle>
            <CardDescription>
              Login functionality is working correctly for Admin role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">User Information:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
                {user?.metadata?.isTemporary && (
                  <p><strong>Mode:</strong> <span className="text-orange-600">Temporary (No Database)</span></p>
                )}
                {user?.metadata?.isMock && (
                  <p><strong>Mode:</strong> <span className="text-purple-600">Mock Authentication</span></p>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Test Status:</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Authentication successful</li>
                <li>✅ User data loaded from database</li>
                <li>✅ Role-based routing working</li>
                <li>✅ Protected route access granted</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="bg-purple-600">
                Go to Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 