// Session management configuration
export const SESSION_CONFIG = {
  // Timeout in milliseconds for inactivity detection (3 minutes for testing, 15 minutes for production)
  INACTIVITY_TIMEOUT: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 3 * 60 * 1000,
  
  // Warning timeout (1 minute before logout for testing, 4 minutes for production)
  WARNING_TIMEOUT: process.env.NODE_ENV === 'production' ? 11 * 60 * 1000 : 2 * 60 * 1000,
  
  // Activity debounce delay to prevent excessive timer resets
  ACTIVITY_DEBOUNCE: 5000, // 5 seconds
  
  // Events that count as user activity
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown',
    'keyup'
  ],
  
  // Storage keys for localStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    LAST_ACTIVITY: 'last_activity'
  }
};

// Get warning duration (time between warning and logout)
export const getWarningDuration = (): number => {
  return SESSION_CONFIG.INACTIVITY_TIMEOUT - SESSION_CONFIG.WARNING_TIMEOUT;
};

// Helper function to check if session is expired
export const isSessionExpired = (lastActivity: Date | null): boolean => {
  if (!lastActivity) return true;
  
  const now = Date.now();
  const activityTime = lastActivity.getTime();
  return (now - activityTime) > SESSION_CONFIG.INACTIVITY_TIMEOUT;
};

// Helper function to get remaining session time
export const getRemainingSessionTime = (lastActivity: Date | null): number => {
  if (!lastActivity) return 0;
  
  const now = Date.now();
  const activityTime = lastActivity.getTime();
  const elapsed = now - activityTime;
  return Math.max(0, SESSION_CONFIG.INACTIVITY_TIMEOUT - elapsed);
}; 