'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, MessageSquare } from 'lucide-react';
import type { ChatSession } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ChatHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const chatsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats'), 
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: chats, isLoading } = useCollection<ChatSession>(chatsQuery);

  const handleNewChat = () => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}`);
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">Chat History</h1>
        <p className="text-muted-foreground text-lg mt-2">Revisit your past conversations.</p>
      </header>
      
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && chats && chats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <Link href={`/chat/${chat.id}`} key={chat.id}>
              <Card className="hover:border-primary/80 hover:bg-card/90 transition-all h-full">
                <CardHeader>
                  <CardTitle className="truncate">{chat.title}</CardTitle>
                  <CardDescription>
                    {chat.createdAt ? `${formatDistanceToNow(chat.createdAt.toDate(), { addSuffix: true })}` : 'No date'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (!chats || chats.length === 0) && (
        <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed rounded-lg bg-card/50">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No Chats Yet</h2>
            <p className="text-muted-foreground mt-2 mb-4">Start a new conversation to see your history here.</p>
            <Button onClick={handleNewChat}>Start New Chat</Button>
        </div>
      )}
    </div>
  );
}
