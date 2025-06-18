import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authApi } from '@/lib/api';
import { User } from '@/types';
import { SESSION_CONFIG, getWarningDuration } from '@/config/session';
import { InactivityWarningModal } from '@/components/InactivityWarningModal';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  lastActivity: Date | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Inactivity detection state
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  
  // Timer references
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // Core logout function (defined early to avoid circular dependencies)
  const logoutUser = useCallback(async () => {
    setIsLoggingOut(true);
    
    // Clear all session-related timers and state
    clearAllTimers();
    setShowWarning(false);
    setLastActivity(null);
    
    try {
      // First, call the API to invalidate the session
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed, but continuing with local cleanup:', error);
    } finally {
      // Clean up local state in a coordinated manner
      localStorage.removeItem('auth_token');
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
      
      // Use a small delay to ensure any pending renders complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear user state (this will trigger ProtectedRoute navigation)
      setUser(null);
      setIsLoggingOut(false);
    }
  }, [clearAllTimers]);

  // Handle inactivity logout
  const handleInactivityLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    toast.error('Session expired due to inactivity');
    
    try {
      await logoutUser();
    } catch (error) {
      // Logout anyway even if API call fails
      setUser(null);
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
      clearAllTimers();
      setShowWarning(false);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logoutUser, clearAllTimers]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!user || isLoggingOut) return;

    // Update last activity timestamp (LOCAL ONLY - no API calls)
    const now = new Date();
    setLastActivity(now);

    // Clear existing timers
    clearAllTimers();
    setShowWarning(false);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_CONFIG.WARNING_TIMEOUT);

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, SESSION_CONFIG.INACTIVITY_TIMEOUT);
  }, [user, isLoggingOut, clearAllTimers, handleInactivityLogout]);

  // Debounced activity handler to prevent excessive timer resets
  const handleActivity = useCallback(() => {
    if (!user || isLoggingOut) return;

    // Clear existing debounce timer
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }

    // Set new debounced timer
    activityDebounceRef.current = setTimeout(() => {
      resetInactivityTimer();
    }, SESSION_CONFIG.ACTIVITY_DEBOUNCE);
  }, [user, isLoggingOut, resetInactivityTimer]);

  // Activity event listeners
  useEffect(() => {
    if (!user || isLoggingOut) {
      clearAllTimers();
      return;
    }

    // Add event listeners for all activity events
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true });
    });

    // Initialize timer on user login
    resetInactivityTimer();

    // Cleanup on unmount or user change
    return () => {
      SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }, [user, isLoggingOut, handleActivity, resetInactivityTimer, clearAllTimers]);

  // Handle staying logged in from warning modal
  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getProfile();
          setUser(userData.data);
          
          // Restore last activity from localStorage
          const storedActivity = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
          if (storedActivity) {
            setLastActivity(new Date(storedActivity));
          }
        } catch (error) {
          console.warn('Auth initialization failed:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
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

  // Public logout function for external use
  const logout = logoutUser;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isLoggingOut, 
      login, 
      logout, 
      resetInactivityTimer,
      lastActivity 
    }}>
      {children}
      
      {/* Inactivity Warning Modal */}
      {showWarning && user && !isLoggingOut && (
        <InactivityWarningModal
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={logoutUser}
          warningDuration={getWarningDuration()}
        />
      )}
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