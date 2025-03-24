
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Layout Components
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const queryClient = new QueryClient();

// Layout component that includes the Sidebar and Header
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  
  // Animation for page transitions
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-16 lg:pl-64">
        <Header />
        <main className={`flex-1 transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Layout>
                <Dashboard />
              </Layout>
            } 
          />
          <Route 
            path="/students" 
            element={
              <Layout>
                <Students />
              </Layout>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <Layout>
                <Reports />
              </Layout>
            } 
          />
          <Route 
            path="/audit-log" 
            element={
              <Layout>
                <AuditLog />
              </Layout>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Layout>
                <Settings />
              </Layout>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
