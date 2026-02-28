'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { ChatSession } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ChatHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

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

  const handleDeleteChat = async () => {
    if (!user || !chatToDelete || !firestore) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'chats', chatToDelete.id);
      await deleteDoc(docRef);
      toast({ title: "Chat Deleted", description: `"${chatToDelete.title}" has been removed.` });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({ title: "Error", description: "Failed to delete chat.", variant: 'destructive'});
    } finally {
      setChatToDelete(null);
    }
  }

  const handleDeleteAllChats = async () => {
    if (!user || !chats || chats.length === 0 || !firestore) return;
    try {
        const batch = writeBatch(firestore);
        chats.forEach(chat => {
            const docRef = doc(firestore, 'users', user.uid, 'chats', chat.id);
            batch.delete(docRef);
        });
        await batch.commit();
        toast({ title: "All Chats Deleted", description: "Your chat history has been cleared." });
    } catch (error) {
        console.error("Error deleting all chats:", error);
        toast({ title: "Error", description: "Failed to delete all chats.", variant: 'destructive'});
    } finally {
        setIsDeleteAllOpen(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl">Chat History</h1>
          <p className="text-muted-foreground text-base mt-1">Revisit or delete your past conversations.</p>
        </div>
        {!isLoading && chats && chats.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteAllOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
        )}
      </header>
      
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && chats && chats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {chats.map((chat) => (
            <Link href={`/chat/${chat.id}`} key={chat.id} className="group block">
              <Card className="hover:border-primary/80 hover:bg-card/90 transition-all h-full relative group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2 group-focus-within:ring-offset-background">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="truncate pr-7 text-sm font-semibold sm:text-base">{chat.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {chat.createdAt ? `${formatDistanceToNow(chat.createdAt.toDate(), { addSuffix: true })}` : 'No date'}
                  </CardDescription>
                </CardHeader>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setChatToDelete(chat);
                  }}
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (!chats || chats.length === 0) && (
        <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed rounded-lg bg-card/50 p-4 mt-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Chats Yet</h2>
            <p className="text-muted-foreground mt-1 mb-4 max-w-xs">Start a new conversation to see your history here.</p>
            <Button onClick={handleNewChat}>Start New Chat</Button>
        </div>
      )}

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete the chat titled "<strong>{chatToDelete?.title}</strong>". This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteChat} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete your entire chat history. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllChats} className={cn(buttonVariants({ variant: "destructive" }))}>Delete All</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
