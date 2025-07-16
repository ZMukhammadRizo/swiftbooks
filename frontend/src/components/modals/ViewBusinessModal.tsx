import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Eye, Building, User, MapPin, Calendar, DollarSign, Activity, BarChart3 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  createdDate: string;
  revenue: number;
  employeeCount?: number;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  lastActivity: string;
  transactionCount: number;
}

interface ViewBusinessModalProps {
  business: Business;
  trigger?: React.ReactNode;
}

export const ViewBusinessModal: React.FC<ViewBusinessModalProps> = ({ business, trigger }) => {
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

  const getRevenueStatus = (revenue: number) => {
    if (revenue >= 100000) return { text: 'High Revenue', color: 'text-green-600' };
    if (revenue >= 50000) return { text: 'Medium Revenue', color: 'text-blue-600' };
    if (revenue >= 10000) return { text: 'Growing', color: 'text-yellow-600' };
    return { text: 'Startup', color: 'text-gray-600' };
  };

  const revenueStatus = getRevenueStatus(business.revenue);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <span>Business Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete business information for {business.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="font-medium">{business.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{business.industry}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusColor(business.status)}>
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{business.owner}</p>
                    <p className="text-xs text-gray-500">{business.ownerEmail}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(business.createdDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Activity</p>
                    <p className="font-medium">{formatDate(business.lastActivity)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(business.revenue)}
                </p>
                <p className={`text-sm ${revenueStatus.color}`}>
                  {revenueStatus.text}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {business.transactionCount}
                </p>
                <p className="text-sm text-blue-600">
                  Total transactions
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Employees</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {business.employeeCount || 1}
                </p>
                <p className="text-sm text-purple-600">
                  Team members
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          {business.subscription && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Subscription Details</h3>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                  <Building className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <Badge className={getStatusColor(business.subscription)}>
                    {business.subscription.charAt(0).toUpperCase() + business.subscription.slice(1)} Plan
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Transaction</span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(business.transactionCount > 0 ? business.revenue / business.transactionCount : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue per Employee</span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(business.revenue / (business.employeeCount || 1))}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Business Age</span>
                  <span className="text-sm text-gray-600">
                    {Math.floor((new Date().getTime() - new Date(business.createdDate).getTime()) / (1000 * 3600 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Activity Score</span>
                  <span className="text-sm text-gray-600">
                    {Math.floor((new Date().getTime() - new Date(business.lastActivity).getTime()) / (1000 * 3600 * 24)) < 7 ? 'High' : 'Medium'}
                  </span>
                </div>
              </div>
            </div>
          </div>
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