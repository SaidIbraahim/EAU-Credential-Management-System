
import { Search, Bell, User } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 animation-fade-in">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
        Alumni Management System
      </h1>
      
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-1.5 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-48 lg:w-64"
          />
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full"></span>
          </button>
        </div>
        
        {/* User Avatar */}
        <div className="relative">
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white">
            <span className="text-sm font-medium">JD</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
