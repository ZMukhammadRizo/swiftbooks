import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth, useAuthWithNavigation } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { ClientTestPage, AccountantTestPage, AdminTestPage } from '@/components/TestPages';
import { Toaster } from 'sonner';
import './index.css';

// Import layout components
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { UserLayout } from '@/components/layouts/UserLayout';
import { AccountantLayout } from '@/components/layouts/AccountantLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

// Import section components
import { UserOverview } from '@/components/user/sections/UserOverview';
import { UserTransactions } from '@/components/user/sections/UserTransactions';
import { UserGoals } from '@/components/user/sections/UserGoals';
import { UserAnalytics } from '@/components/user/sections/UserAnalytics';
import { UserSettings } from '@/components/user/sections/UserSettings';
import { ClientDocuments } from '@/components/client/sections/ClientDocuments';
import { ClientSettings } from '@/components/client/sections/ClientSettings';

import { AccountantOverview } from '@/components/accountant/sections/AccountantOverview';
import { AccountantClients } from '@/components/accountant/sections/AccountantClients';
import { AccountantTasks } from '@/components/accountant/sections/AccountantTasks';
import { AccountantReports } from '@/components/accountant/sections/AccountantReports';

import { AdminOverview } from '@/components/admin/sections/AdminOverview';
import { AdminUsers } from '@/components/admin/sections/AdminUsers';
import { AdminBusinesses } from '@/components/admin/sections/AdminBusinesses';
import { AdminFinancial } from '@/components/admin/sections/AdminFinancial';
import { AdminSystem } from '@/components/admin/sections/AdminSystem';

// Dashboard Router Component - now redirects to section-based routes
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard overview based on role
  switch (user.role) {
    case 'client':
    case 'user':
      return <Navigate to="/user/overview" replace />;
    case 'accountant':
      return <Navigate to="/accountant/overview" replace />;
    case 'admin':
      return <Navigate to="/admin/overview" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};



// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'user' | 'accountant' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has access to the required role
  // Treat 'client' and 'user' as equivalent roles
  const hasAccess = () => {
    if (!requiredRole) return true;
    
    // Allow both 'client' and 'user' to access client routes
    if ((requiredRole === 'client' || requiredRole === 'user') && 
        (user.role === 'client' || user.role === 'user')) {
      return true;
    }
    
    // For other roles, require exact match
    return user.role === requiredRole;
  };

  if (!hasAccess()) {
    // Redirect to appropriate dashboard for user's role
    switch (user.role) {
      case 'client':
      case 'user':
        return <Navigate to="/user/overview" replace />;
      case 'accountant':
        return <Navigate to="/accountant/overview" replace />;
      case 'admin':
        return <Navigate to="/admin/overview" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

// Auto-navigation component
const AutoNavigation = () => {
  const { authenticated, user, loading } = useAuthWithNavigation();
  const location = useLocation();

  // Only redirect if we're on the root path and user is authenticated
  if (!loading && authenticated && user && location.pathname === '/') {
    switch (user.role) {
      case 'client':
      case 'user':
        return <Navigate to="/user/overview" replace />;
      case 'accountant':
        return <Navigate to="/accountant/overview" replace />;
      case 'admin':
        return <Navigate to="/admin/overview" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return null;
};

// Login wrapper component
const LoginWrapper = () => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
};

// Test route wrapper
const TestRouteWrapper = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'client':
    case 'user':
      return <ClientTestPage />;
    case 'accountant':
      return <AccountantTestPage />;
    case 'admin':
      return <AdminTestPage />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Root route with auto-navigation */}
      <Route path="/" element={<AutoNavigation />} />
      
      {/* Login route */}
      <Route path="/login" element={<LoginWrapper />} />
      
      {/* Dashboard route */}
      <Route path="/dashboard" element={<DashboardRouter />} />
      
      {/* Test route */}
      <Route path="/test" element={<TestRouteWrapper />} />
      
      {/* User routes - personal finance management */}
      <Route 
        path="/user" 
        element={
          <ProtectedRoute requiredRole="client">
            <UserLayout>
              <Outlet />
            </UserLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<UserOverview />} />
        <Route path="overview" element={<UserOverview />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="goals" element={<UserGoals />} />
        <Route path="analytics" element={<UserAnalytics />} />
        <Route path="documents" element={<ClientDocuments />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>
      
      {/* Accountant routes */}
      <Route 
        path="/accountant" 
        element={
          <ProtectedRoute requiredRole="accountant">
            <AccountantLayout>
              <Outlet />
            </AccountantLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<AccountantOverview />} />
        <Route path="overview" element={<AccountantOverview />} />
        <Route path="clients" element={<AccountantClients />} />
        <Route path="tasks" element={<AccountantTasks />} />
        <Route path="reports" element={<AccountantReports />} />
      </Route>
      

      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="financial" element={<AdminFinancial />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 