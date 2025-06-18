import React from 'react';
import Header from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { DataProvider } from '@/contexts/DataContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default Layout; 