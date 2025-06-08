import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getProfile();
          setUser(userData.data);
        } catch (error) {
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: userData } = await authApi.login(email, password);
    setUser(userData);
  };

  const logout = async () => {
    setIsLoggingOut(true);
    
    try {
      // First, call the API to invalidate the session
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed, but continuing with local cleanup:', error);
    } finally {
      // Clean up local state in a coordinated manner
      localStorage.removeItem('auth_token');
      
      // Use a small delay to ensure any pending renders complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear user state (this will trigger ProtectedRoute navigation)
      setUser(null);
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggingOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 