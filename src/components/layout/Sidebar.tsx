
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const nav = [
    { 
      name: "Dashboard", 
      path: "/", 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      name: "Students", 
      path: "/students", 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      name: "Reports", 
      path: "/reports", 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      name: "Settings", 
      path: "/settings", 
      icon: <Settings className="w-5 h-5" /> 
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-primary-500 text-white z-30 transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-16" : "w-64",
          isMobile && collapsed && "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-primary-600",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="bg-primary-foreground text-primary-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                E
              </div>
              <span>EAU</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar} 
            className={cn(
              "p-1 rounded-full hover:bg-primary-600 transition-colors",
              collapsed && "mx-auto"
            )}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {nav.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all hover:bg-primary-600",
                    location.pathname === item.path && "bg-primary-600 font-medium",
                    collapsed && "justify-center"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button */}
        <div className="p-2 mt-auto border-t border-primary-600">
          <button 
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg w-full text-left transition-all hover:bg-primary-600",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Toggle button for mobile */}
      {isMobile && collapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-20 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Open sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

export default Sidebar;
