import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User } from "@/types";
import { authApi } from "@/api/apiClient";
import AdminManagement from "@/components/admin/AdminManagement";
import SettingsSkeleton from "@/components/ui/SettingsSkeleton";
import { Shield, User as UserIcon, Lock } from "lucide-react";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileForm {
  email: string;
}

const Settings = () => {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({ email: user.email });
    }
  }, [user]);

  // Check if current user is Super Admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await authApi.updateProfile({ email: profileForm.email.trim() });
      setUser(updatedUser); // Update user in context
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const errorMessage = error?.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({ email: user?.email || '' });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="admin-management" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Management
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and manage your account information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center sm:items-start space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-xl bg-primary-500 text-white">
                      {user ? getInitials(user.email) : 'NA'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditingProfile ? (
                      <form onSubmit={handleProfileSave} className="space-y-3">
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ email: e.target.value })}
                          placeholder="Enter email address"
                          required
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            size="sm" 
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isLoading ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                        />
                        <Button 
                          onClick={() => setIsEditingProfile(true)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Account Status</Label>
                    <Input
                      id="status"
                      value={user?.isActive ? 'Active' : 'Inactive'}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="created">Account Created</Label>
                    <Input
                      id="created"
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure. Use a strong password with at least 6 characters.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="ml-auto" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="admin-management" className="mt-6">
            <AdminManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
