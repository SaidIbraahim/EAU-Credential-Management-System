import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff, Mail, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/apiClient';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

  const getSecurityMessage = (error: string) => {
    if (error.includes('deactivated')) {
      return {
        title: 'Account Deactivated',
        message: error,
        type: 'warning' as const
      };
    }
    if (error.includes('Invalid credentials')) {
      return {
        title: 'Login Failed',
        message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        type: 'error' as const
      };
    }
    if (error.includes('not properly configured')) {
      return {
        title: 'Account Configuration Issue',
        message: 'Your account is not properly set up. Please contact the system administrator for assistance.',
        type: 'warning' as const
      };
    }
    return {
      title: 'Login Error',
      message: error,
      type: 'error' as const
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful! Welcome back.');
      navigate('/', { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Don't show toast for login errors since we show them in UI
      console.log('Login error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleForgotPassword = async () => {
    setIsResettingPassword(true);
    
    try {
      if (forgotPasswordStep === 'email') {
        if (!forgotPasswordData.email || !forgotPasswordData.email.includes('@')) {
          toast.error('Please enter a valid email address');
          return;
        }
        
        const response = await authApi.forgotPassword(forgotPasswordData.email);
        toast.success(response.message);
        setForgotPasswordStep('verify');
        
      } else if (forgotPasswordStep === 'verify') {
        if (!forgotPasswordData.verificationCode || forgotPasswordData.verificationCode.length !== 6) {
          toast.error('Please enter the 6-digit verification code');
          return;
        }
        
        const response = await authApi.verifyResetCode(forgotPasswordData.email, forgotPasswordData.verificationCode);
        toast.success(response.message);
        setForgotPasswordStep('reset');
        
      } else if (forgotPasswordStep === 'reset') {
        const passwordError = validatePassword(forgotPasswordData.newPassword);
        if (passwordError) {
          toast.error(passwordError);
          return;
        }
        
        if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        
        const response = await authApi.resetPassword(
          forgotPasswordData.email, 
          forgotPasswordData.verificationCode, 
          forgotPasswordData.newPassword
        );
        toast.success(response.message);
        setShowForgotPassword(false);
        setForgotPasswordStep('email');
        setForgotPasswordData({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordData({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });
  };

  const errorInfo = error ? getSecurityMessage(error) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-[420px] shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorInfo && (
              <Alert variant={errorInfo.type === 'warning' ? 'default' : 'destructive'} className="border-l-4">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <div className="font-medium">{errorInfo.title}</div>
                  <AlertDescription className="mt-1">{errorInfo.message}</AlertDescription>
                </div>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                Forgot your password?
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {forgotPasswordStep === 'email' && 'Reset Password'}
              {forgotPasswordStep === 'verify' && 'Verify Your Email'}
              {forgotPasswordStep === 'reset' && 'Set New Password'}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' && 'Enter your email address and we\'ll send you a verification code to reset your password.'}
              {forgotPasswordStep === 'verify' && 'Enter the 6-digit verification code sent to your email.'}
              {forgotPasswordStep === 'reset' && 'Create a new secure password for your account.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {forgotPasswordStep === 'email' && (
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotPasswordData.email}
                  onChange={(e) => setForgotPasswordData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  disabled={isResettingPassword}
                />
              </div>
            )}

            {forgotPasswordStep === 'verify' && (
              <div className="space-y-2">
                <label htmlFor="verification-code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={forgotPasswordData.verificationCode}
                  onChange={(e) => setForgotPasswordData(prev => ({
                    ...prev,
                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                  }))}
                  disabled={isResettingPassword}
                />
                <div className="text-xs text-blue-600">
                  Check your email for the 6-digit verification code
                </div>
              </div>
            )}

            {forgotPasswordStep === 'reset' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={forgotPasswordData.newPassword}
                    onChange={(e) => setForgotPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    disabled={isResettingPassword}
                  />
                  <div className="text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={forgotPasswordData.confirmPassword}
                    onChange={(e) => setForgotPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    disabled={isResettingPassword}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForgotPasswordDialog} disabled={isResettingPassword}>
              Cancel
            </Button>
            <Button onClick={handleForgotPassword} disabled={isResettingPassword}>
              {isResettingPassword ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  {forgotPasswordStep === 'email' && 'Send Code'}
                  {forgotPasswordStep === 'verify' && 'Verify Code'}
                  {forgotPasswordStep === 'reset' && 'Reset Password'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 