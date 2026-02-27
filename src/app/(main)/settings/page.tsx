'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const { toast } = useToast();

  if (!user) {
    return null; // Layout handles redirect
  }

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newUsername = formData.get('username') as string;
    
    if (newUsername.length >= 3) {
      setUser({ ...user, username: newUsername });
      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
    } else {
       toast({
        title: 'Error',
        description: 'Username must be at least 3 characters long.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">My Account</h1>
        <p className="text-muted-foreground text-lg mt-2">Manage your profile and settings.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Edit your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSaveChanges}>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline">Change Photo</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" defaultValue={user.username} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" defaultValue={user.age} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" defaultValue={user.gender} disabled />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Dark theme is enabled by default.</p>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all associated data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => toast({ title: 'This action is not available yet.', variant: 'destructive'})}>Delete My Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
