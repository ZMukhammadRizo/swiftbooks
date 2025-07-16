import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth, useAuthWithNavigation } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { ClientTestPage, AccountantTestPage, AdminTestPage } from '@/components/TestPages';
import { Toaster } from 'sonner';
import './index.css';

// Import layout components
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ClientLayout } from '@/components/layouts/ClientLayout';
import { AccountantLayout } from '@/components/layouts/AccountantLayout';
import { ConsultantLayout } from '@/components/layouts/ConsultantLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

// Import section components
import { ClientOverview } from '@/components/client/sections/ClientOverview';
import { ClientAIAssistant } from '@/components/client/sections/ClientAIAssistant';
import { ClientTransactions } from '@/components/client/sections/ClientTransactions';
import { ClientDocuments } from '@/components/client/sections/ClientDocuments';
import { ClientMeetings } from '@/components/client/sections/ClientMeetings';
import { ClientSettings } from '@/components/client/sections/ClientSettings';

import { AccountantOverview } from '@/components/accountant/sections/AccountantOverview';
import { AccountantClients } from '@/components/accountant/sections/AccountantClients';
import { AccountantTasks } from '@/components/accountant/sections/AccountantTasks';
import { AccountantReports } from '@/components/accountant/sections/AccountantReports';

import { ConsultantOverview } from '@/components/consultant/sections/ConsultantOverview';

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
    case 'user':
      return <Navigate to="/user/overview" replace />;
    case 'accountant':
      return <Navigate to="/accountant/overview" replace />;
    case 'consultant':
      return <Navigate to="/consultant/overview" replace />;
    case 'admin':
      return <Navigate to="/admin/overview" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Create placeholder components for consultant sections
const ConsultantClients = () => <div className="p-6"><h2>Consultant Clients</h2><p>Client management for consultants coming soon...</p></div>;
const ConsultantConsultations = () => <div className="p-6"><h2>Consultations</h2><p>Session management coming soon...</p></div>;
const ConsultantAnalytics = () => <div className="p-6"><h2>Analytics</h2><p>Client analytics coming soon...</p></div>;
const ConsultantGoals = () => <div className="p-6"><h2>Goals</h2><p>Goal tracking coming soon...</p></div>;
const ConsultantReports = () => <div className="p-6"><h2>Reports</h2><p>Report generation coming soon...</p></div>;
const ConsultantSchedule = () => <div className="p-6"><h2>Schedule</h2><p>Appointment scheduling coming soon...</p></div>;
const ConsultantSettings = () => <div className="p-6"><h2>Settings</h2><p>Consultant settings coming soon...</p></div>;

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'accountant' | 'consultant' | 'admin';
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

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard for user's role
    switch (user.role) {
      case 'client':
        return <Navigate to="/client/overview" replace />;
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

  useEffect(() => {
    if (!loading && authenticated && user && location.pathname === '/') {
      // Auto-redirect to appropriate dashboard
      switch (user.role) {
        case 'user':
          window.location.href = '/user/overview';
          break;
        case 'accountant':
          window.location.href = '/accountant/overview';
          break;
        case 'consultant':
          window.location.href = '/consultant/overview';
          break;
        case 'admin':
          window.location.href = '/admin/overview';
          break;
        default:
          window.location.href = '/login';
      }
    }
  }, [authenticated, user, loading, location.pathname]);

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
      
      {/* User routes (formerly client routes) */}
      <Route 
        path="/user" 
        element={
          <ProtectedRoute requiredRole="user">
            <ClientLayout>
              <Outlet />
            </ClientLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<ClientOverview />} />
        <Route path="overview" element={<ClientOverview />} />
        <Route path="ai-assistant" element={<ClientAIAssistant />} />
        <Route path="transactions" element={<ClientTransactions />} />
        <Route path="documents" element={<ClientDocuments />} />
        <Route path="meetings" element={<ClientMeetings />} />
        <Route path="settings" element={<ClientSettings />} />
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
      
      {/* Consultant routes */}
      <Route 
        path="/consultant" 
        element={
          <ProtectedRoute requiredRole="consultant">
            <ConsultantLayout>
              <Outlet />
            </ConsultantLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<ConsultantOverview />} />
        <Route path="overview" element={<ConsultantOverview />} />
        <Route path="clients" element={<ConsultantClients />} />
        <Route path="consultations" element={<ConsultantConsultations />} />
        <Route path="analytics" element={<ConsultantAnalytics />} />
        <Route path="goals" element={<ConsultantGoals />} />
        <Route path="reports" element={<ConsultantReports />} />
        <Route path="schedule" element={<ConsultantSchedule />} />
        <Route path="settings" element={<ConsultantSettings />} />
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