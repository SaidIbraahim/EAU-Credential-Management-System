
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="animation-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center sm:items-start space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xl bg-primary-500 text-white">SI</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="Said" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Ibrahim" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="info@saidibrahim.tech" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Administrator" disabled />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="animation-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-6">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  Add New User
                </Button>
              </div>
              
              <div className="rounded-lg border min-h-[300px] flex items-center justify-center">
                <p className="text-gray-500">No users found. Add users to see them here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="animation-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  Update Password
                </Button>
              </div>
              
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-medium">Enable 2FA</h4>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <Switch id="2fa" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="animation-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Database Backup</CardTitle>
              <CardDescription>
                Manage database backups and restore points.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Manual Backup</h3>
                <p className="text-sm text-gray-500">
                  Create a full backup of the database. This process may take a few minutes depending on the size of your data.
                </p>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  Create Backup
                </Button>
              </div>
              
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Backup History</h3>
                <div className="rounded-lg border min-h-[200px] flex items-center justify-center">
                  <p className="text-gray-500">No backup history found. Create a backup to see it here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
