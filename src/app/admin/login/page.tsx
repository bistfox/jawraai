'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { isAdminEmail } from '@/lib/admin';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const app = useFirebaseApp();
    const auth = getAuth(app);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (isAdminEmail(user.email)) {
                toast({ title: "Welcome Admin!", description: "Redirecting to dashboard..." });
                router.push('/admin/dashboard');
            } else {
                await auth.signOut(); // Sign out non-admin user
                toast({
                    title: "Access Denied",
                    description: "You do not have permission to access the admin panel.",
                    variant: "destructive",
                });
                setIsLoading(false);
            }
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast({ title: 'Login Failed', description: 'Invalid email or password.', variant: 'destructive' });
            } else if (error.code === 'auth/too-many-requests') {
                 toast({ title: 'Login Failed', description: 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.', variant: 'destructive' });
            } else {
                toast({ title: 'Login Error', description: error.message, variant: 'destructive' });
            }
            setIsLoading(false);
        }
    };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Bot className="w-12 h-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Admin Panel</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
