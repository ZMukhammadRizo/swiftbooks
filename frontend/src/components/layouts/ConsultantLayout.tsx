import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { ConsultantSidebar } from './ConsultantSidebar';

interface ConsultantLayoutProps {
  children?: React.ReactNode;
}

export const ConsultantLayout: React.FC<ConsultantLayoutProps> = ({ children }) => {
  return (
    <DashboardLayout sidebar={<ConsultantSidebar />}>
      {children || <Outlet />}
    </DashboardLayout>
  );
}; 