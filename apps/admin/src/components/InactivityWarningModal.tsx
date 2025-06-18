import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface InactivityWarningModalProps {
  onStayLoggedIn: () => void;
  onLogout: () => void;
  warningDuration: number; // Duration in seconds
}

export function InactivityWarningModal({ 
  onStayLoggedIn, 
  onLogout, 
  warningDuration 
}: InactivityWarningModalProps) {
  const [countdown, setCountdown] = useState(warningDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto logout when countdown reaches 0
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize countdown
    setCountdown(warningDuration);

    return () => clearInterval(timer);
  }, [onLogout, warningDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            You have been inactive for a while. For security reasons, you will be automatically logged out soon.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-6 w-6 text-red-500" />
              <span className="text-sm text-gray-600">Time remaining:</span>
            </div>
            <div className="text-3xl font-bold text-red-600 font-mono">
              {formatTime(countdown)} {countdown > 60 ? 'minutes' : 'seconds'}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onStayLoggedIn} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Stay Logged In
            </Button>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
            >
              Logout Now
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Click anywhere or perform any action to stay logged in
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 