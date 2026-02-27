'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, MessageSquare, PlusSquare, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useSidebar } from './sidebar';

export function MobileBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const handleNewChat = () => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}`);
  };

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { onClick: handleNewChat, icon: PlusSquare, label: 'New Chat' },
    { href: '/chat/history', icon: MessageSquare, label: 'History' },
    { onClick: toggleSidebar, icon: PanelLeft, label: 'More' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-t">
      <div className="grid h-16 grid-cols-4 items-center justify-items-center">
        {navItems.map((item, index) => {
          const isActive = item.href ? (item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)) : false;
          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                'flex flex-col items-center justify-center h-full w-full rounded-none text-muted-foreground hover:bg-transparent hover:text-primary focus:text-primary',
                isActive && 'text-primary'
              )}
              onClick={item.onClick ? item.onClick : () => router.push(item.href!)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
