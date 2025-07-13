
import { User } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 animation-fade-in">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
        Alumni Management System
      </h1>
      
      <div className="flex items-center">
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
