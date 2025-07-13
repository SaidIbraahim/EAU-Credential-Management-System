import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/apiClient'; // ✅ FIX: Use consistent API client
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // ✅ FIX: Don't try to validate token on login page to prevent redirect loop
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath.includes('/login')) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getProfile();
          setUser(userData); // ✅ FIX: authApi.getProfile() already returns the user data directly
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
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      // authApi.logout() already handles token removal, just clear user state
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
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