'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, MessageSquare, PlusSquare, Settings, User as UserIcon, LogOut, Bot } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import React, { useEffect } from 'react';

const JawraLogo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Bot className="w-8 h-8 text-primary" />
      <h1 className="font-headline text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
        JawraAI
      </h1>
    </Link>
);


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, setUser } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/onboarding');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };
  
  const handleNewChat = () => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}`);
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4 justify-between">
          <JawraLogo />
          <SidebarTrigger className="group-data-[collapsible=icon]:flex hidden" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip={{children: 'Dashboard'}}>
                <Link href="/dashboard"><Home /><span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewChat} tooltip={{children: 'New Chat'}}>
                <PlusSquare /><span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/chat')} tooltip={{children: 'Chat History'}}>
                <Link href="/chat/history"><MessageSquare /><span>Chat History</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={{children: 'My Account'}}>
                <Link href="/settings"><UserIcon /><span>My Account</span></Link>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
