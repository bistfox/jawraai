'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Users,
  CreditCard,
  BarChart2,
  Settings,
  Shield,
  Bot,
  LogOut,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useUser } from '@/lib/hooks/use-user';
import React, { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { Toaster } from "@/components/ui/toaster";
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminLogo = () => (
  <Link href="/admin/dashboard" className="flex items-center gap-2">
    <Shield className="w-8 h-8 text-primary" />
    <h1 className="font-headline text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
      Admin
    </h1>
  </Link>
);

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading } = useUser();
    const auth = getAuth();
    const firestore = useFirestore();
    const [adminChecked, setAdminChecked] = React.useState(false);
    const [isAdmin, setIsAdmin] = React.useState(false);
    
    useEffect(() => {
        if (isLoading) return;
        if (!user && pathname !== '/admin/login') {
            router.replace('/admin/login');
            return;
        }
        if (!user) return;

        const run = async () => {
          try {
            const adminRef = doc(firestore, 'admins', user.uid);
            const snap = await getDoc(adminRef);
            const ok = snap.exists();
            setIsAdmin(ok);
            setAdminChecked(true);
            if (!ok && pathname !== '/admin/login') router.replace('/admin/login');
          } catch {
            setIsAdmin(false);
            setAdminChecked(true);
            if (pathname !== '/admin/login') router.replace('/admin/login');
          }
        };
        run();
    }, [user, isLoading, router, pathname, firestore]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/admin/login');
    };

    if ((isLoading || !user || !adminChecked || !isAdmin) && pathname !== '/admin/login') {
       return (
         <div className="flex h-screen items-center justify-center bg-background">
           <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
         </div>
       );
    }
    
    if (pathname === '/admin/login') {
        return <div className="min-h-screen bg-background">
            {children}
            <Toaster/>
        </div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SidebarProvider>
              <Sidebar>
                <SidebarRail />
                <SidebarHeader className="p-4 justify-between">
                  <AdminLogo />
                  <SidebarTrigger className="group-data-[collapsible=icon]:flex hidden" />
                </SidebarHeader>
                <SidebarContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} tooltip={{children: 'Dashboard'}}>
                        <Link href="/admin/dashboard"><Home /><span>Dashboard</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/subscriptions')} tooltip={{children: 'Subscriptions'}}>
                        <Link href="/admin/subscriptions"><FileText /><span>Subscriptions</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')} tooltip={{children: 'Users'}}>
                        <Link href="/admin/users"><Users /><span>Users</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/characters')} tooltip={{children: 'Characters'}}>
                        <Link href="/admin/characters"><Sparkles /><span>Characters</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/payments')} tooltip={{children: 'Payments'}}>
                        <Link href="/admin/payments"><CreditCard /><span>Payments</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/analytics')} tooltip={{children: 'Analytics'}}>
                        <Link href="/admin/analytics"><BarChart2 /><span>Analytics</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} tooltip={{children: 'Settings'}}>
                        <Link href="/admin/settings"><Settings /><span>Settings</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} tooltip={{children: 'Logout'}}>
                        <LogOut /><span>Logout</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
              <SidebarInset>
                {children}
                <Toaster />
              </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
