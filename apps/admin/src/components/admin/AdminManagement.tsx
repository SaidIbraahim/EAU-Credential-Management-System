import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usersApi } from "@/api/apiClient";
import { User } from "@/types";
import { toast } from "sonner";
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Shield, 
  ShieldOff, 
  Users, 
  Mail, 
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

interface EditUserForm {
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
}

const AdminManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN'
  });

  const [editForm, setEditForm] = useState<EditUserForm>({
    email: '',
    role: 'ADMIN',
    isActive: true
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Check if current user is Super Admin
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Debug function to check token status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('auth_token');
    console.log('🔐 Auth Debug Info:');
    console.log('- Token exists:', !!token);
    console.log('- Token length:', token?.length || 0);
    console.log('- Token preview:', token?.substring(0, 20) + '...' || 'null');
    console.log('- Current user:', currentUser);
    console.log('- Is Super Admin:', isSuperAdmin);
    
    if (!token) {
      toast.error("No authentication token found. Please log out and log back in.");
      return false;
    }
    
    try {
      // Basic JWT structure check (should have 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        toast.error("Invalid token format. Please log out and log back in.");
        return false;
      }
      
      // Try to decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]));
      console.log('- Token payload:', payload);
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        toast.error("Token has expired. Please log out and log back in.");
        return false;
      }
      
      console.log('✅ Token appears valid');
      return true;
    } catch (error) {
      console.error('❌ Token decode error:', error);
      toast.error("Invalid token. Please log out and log back in.");
      return false;
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await usersApi.getAll(page, 10);
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setTotalUsers(response.total);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createForm.password !== createForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      await usersApi.create({
        email: createForm.email,
        password: createForm.password,
        role: createForm.role
      });
      
      toast.success("Admin account created successfully");
      setCreateDialogOpen(false);
      setCreateForm({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'ADMIN'
      });
      fetchUsers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create admin account");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      await usersApi.update(selectedUser.id, {
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive
      });
      
      toast.success("Admin account updated successfully");
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update admin account");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    // Check authentication status before making the request
    if (!checkAuthStatus()) {
      return;
    }

    try {
      console.log(`🗑️ Attempting to delete user ${userId}`);
      console.log('🔐 Token being sent:', localStorage.getItem('auth_token')?.substring(0, 20) + '...');
      
      await usersApi.delete(userId);
      toast.success("Admin account deleted successfully");
      fetchUsers(currentPage);
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log out and log back in.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete users.");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete admin account");
      }
    }
  };

  const handleRevokePrivileges = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot revoke your own privileges");
      return;
    }

    try {
      await usersApi.revokeAdminPrivileges(userId);
      toast.success("Admin privileges revoked successfully");
      fetchUsers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to revoke admin privileges");
    }
  };

  const handleRestorePrivileges = async (userId: number) => {
    try {
      await usersApi.restoreAdminPrivileges(userId);
      toast.success("Admin privileges restored successfully");
      fetchUsers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore admin privileges");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Management
          </CardTitle>
          <CardDescription>
            This section is only accessible to Super Administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">
              You need Super Admin privileges to manage user accounts.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Management
              </CardTitle>
              <CardDescription>
                Create, manage, and monitor admin accounts. Only Super Admins can access this section.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchUsers(currentPage)}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Admin Account</DialogTitle>
                    <DialogDescription>
                      Create a new admin account with specified privileges. Please ensure the email is valid and password is secure.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-email">Email Address *</Label>
                        <Input
                          id="create-email"
                          type="email"
                          placeholder="admin@example.com"
                          value={createForm.email}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="create-role">Role *</Label>
                        <Select 
                          value={createForm.role} 
                          onValueChange={(value: 'ADMIN' | 'SUPER_ADMIN') => 
                            setCreateForm(prev => ({...prev, role: value}))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="create-password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="create-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimum 8 characters"
                            value={createForm.password}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              password: e.target.value
                            }))}
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="create-confirm-password">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="create-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={createForm.confirmPassword}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Admin</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{totalUsers}</p>
              <p className="text-sm text-gray-600">Total Admins</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {users.filter(u => u.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Active Admins</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">
                {users.filter(u => u.role === 'SUPER_ADMIN').length}
              </p>
              <p className="text-sm text-gray-600">Super Admins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            Manage all admin accounts, their roles, and access privileges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-3" />
              <span>Loading admin accounts...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Accounts</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first admin account.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create First Admin
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary-500 text-white text-xs">
                              {getInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            {user.id === currentUser?.id && (
                              <p className="text-xs text-blue-600">You</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openViewDialog(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            {user.isActive ? (
                              <DropdownMenuItem 
                                onClick={() => handleRevokePrivileges(user.id)}
                                disabled={user.id === currentUser?.id}
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Revoke Access
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRestorePrivileges(user.id)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Restore Access
                              </DropdownMenuItem>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={user.id === currentUser?.id}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Account
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the admin account for <strong>{user.email}</strong>? 
                                    This action cannot be undone and will permanently remove all account data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {users.length} of {totalUsers} admin accounts
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Admin Account</DialogTitle>
            <DialogDescription>
              Update admin account information and privileges.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value: 'ADMIN' | 'SUPER_ADMIN') => 
                    setEditForm(prev => ({...prev, role: value}))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Account Status *</Label>
                <Select 
                  value={editForm.isActive ? 'active' : 'inactive'} 
                  onValueChange={(value) => 
                    setEditForm(prev => ({...prev, isActive: value === 'active'}))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Account Details</DialogTitle>
            <DialogDescription>
              View detailed information about this admin account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary-500 text-white text-lg">
                    {getInitials(selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedUser.email}</h3>
                  <Badge variant={selectedUser.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {selectedUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="mt-1">
                    <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Account ID</Label>
                  <p className="mt-1 font-mono text-sm">#{selectedUser.id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                  <p className="mt-1 text-sm">
                    {selectedUser.lastLogin 
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : 'Never logged in'
                    }
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Must Change Password</Label>
                  <p className="mt-1">
                    <Badge variant={selectedUser.mustChangePassword ? 'destructive' : 'default'}>
                      {selectedUser.mustChangePassword ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedUser && (
              <Button onClick={() => openEditDialog(selectedUser)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Account
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement; 