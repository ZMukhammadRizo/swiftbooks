import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Eye, User, Mail, Phone, Building, MapPin, Calendar, DollarSign, Activity } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'accountant' | 'consultant' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  joinDate: string;
  businessCount: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  location?: string;
  totalRevenue?: number;
}

interface ViewUserModalProps {
  user: User;
  trigger?: React.ReactNode;
}

export const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, trigger }) => {
  const [open, setOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'accountant':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client':
        return <User className="h-4 w-4" />;
      case 'accountant':
        return <Activity className="h-4 w-4" />;
      case 'admin':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {getRoleIcon(user.role)}
            </div>
            <span>User Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete profile information for {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <Badge className={getStatusColor(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium">{formatDate(user.joinDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>
            
            {user.subscription && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription</p>
                  <Badge className={getStatusColor(user.subscription)}>
                    {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} Plan
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Business Information (for clients) */}
                        {user.role === 'user' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Businesses</p>
                    <p className="font-medium">{user.businessCount} business{user.businessCount !== 1 ? 'es' : ''}</p>
                  </div>
                </div>
                
                {user.totalRevenue !== undefined && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="font-medium text-green-600">{formatCurrency(user.totalRevenue)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {user.location && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{user.location}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 