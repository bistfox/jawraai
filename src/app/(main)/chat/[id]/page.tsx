'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Send, Copy, RefreshCw, Share2, Mic, Paperclip, Bot } from 'lucide-react';
import { useUser } from '@/lib/hooks/use-user';
import { getAiResponse, regenerateAiResponse } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id: chatId } = params;
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const initialPromptHandled = useRef(false);
  const firestore = useFirestore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const persona = user?.gender === 'Male' 
    ? { name: 'Khangi AI', avatarId: 'khangi-ai-avatar' }
    : { name: 'Jawra AI', avatarId: 'jawra-ai-avatar' };
  
  const personaAvatar = PlaceHolderImages.find(p => p.id === persona.avatarId);

  const messagesQuery = useMemo(() => {
    if (!user || !chatId) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [user, chatId, firestore]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  
  const scrollToBottom = () => {
    setTimeout(() => {
        const scrollableViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTo({ top: scrollableViewport.scrollHeight, behavior: 'smooth' });
        }
    }, 100);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user?.gender || !chatId) return;

    setInput('');
    const userMessageContent = messageText;

    const messagesCollection = collection(firestore, 'users', user.uid, 'chats', chatId, 'messages');
    await addDoc(messagesCollection, {
      role: 'user',
      content: userMessageContent,
      createdAt: serverTimestamp(),
    });

    setIsLoading(true);

    try {
      const aiResponse = await getAiResponse(userMessageContent, user.gender);
      await addDoc(messagesCollection, {
        role: 'model',
        content: aiResponse,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to get AI response:", error);
      toast({ title: 'An error occurred', description: 'Failed to get response from AI.', variant: 'destructive' });
      await addDoc(messagesCollection, {
        role: 'model',
        content: 'Sorry, I had an issue. Please try again.',
        createdAt: serverTimestamp(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && user && firestore && !initialPromptHandled.current) {
        const handleInitialPrompt = async () => {
            initialPromptHandled.current = true;
            
            const chatDocRef = doc(firestore, 'users', user.uid, 'chats', chatId);
            const chatDoc = await getDoc(chatDocRef);

            if (!chatDoc.exists()) {
                await setDoc(chatDocRef, {
                    title: initialPrompt.substring(0, 40) + (initialPrompt.length > 40 ? '...' : ''),
                    createdAt: serverTimestamp(),
                    userId: user.uid,
                });
            }
            await handleSendMessage(initialPrompt);
        };
        handleInitialPrompt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, user, firestore, chatId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleRegenerate = async () => {
    if (!user?.gender || !messages || messages.length === 0) return;
    
    const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
    if (lastModelMessageIndex === -1) return;

    const lastModelMessage = messages[lastModelMessageIndex];
    const history = messages.slice(0, lastModelMessageIndex);
    
    setIsLoading(true);

    try {
      const newResponse = await regenerateAiResponse(history, user.gender);
      const messageDocRef = doc(firestore, 'users', user.uid, 'chats', chatId, 'messages', lastModelMessage.id);
      await updateDoc(messageDocRef, { content: newResponse });

    } catch (error) {
      console.error("Failed to regenerate response:", error);
      toast({ title: 'An error occurred', description: 'Failed to regenerate response.', variant: 'destructive' });
    } finally {
       setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const lastMessageIsModel = messages && messages.length > 0 && messages[messages.length - 1].role === 'model';
  
  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10 flex items-center gap-4 p-4 border-b bg-background">
        <Avatar>
          {personaAvatar && <AvatarImage src={personaAvatar.imageUrl} alt={persona.name} data-ai-hint={personaAvatar.imageHint} />}
          <AvatarFallback><Bot/></AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold text-lg">{persona.name}</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {(isLoadingMessages && !messages) && (
              <div className="flex justify-center items-center h-full">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
          )}
          {messages && messages.map((message) => (
            <div key={message.id} className={cn('flex items-end gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'model' && (
                <Avatar className="h-8 w-8">
                  {personaAvatar && <AvatarImage src={personaAvatar.imageUrl} alt={persona.name} />}
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[75%] rounded-lg p-3 text-white', message.role === 'user' ? 'bg-primary' : 'bg-secondary')}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
              <div className={cn('flex items-end gap-3 justify-start')}>
                <Avatar className="h-8 w-8">
                  {personaAvatar && <AvatarImage src={personaAvatar.imageUrl} alt={persona.name} />}
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
                <div className={cn('max-w-[75%] rounded-lg p-3 text-white bg-secondary')}>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48 bg-background/50" />
                        <Skeleton className="h-4 w-32 bg-background/50" />
                    </div>
                </div>
              </div>
          )}

          {lastMessageIsModel && !isLoading && (
              <div className="flex justify-start ml-12">
                  <div className="flex gap-2 mt-2 border rounded-full border-white/10 p-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(messages[messages.length-1].content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRegenerate}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: 'Share feature coming soon!' })}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
            )}
        </div>
      </ScrollArea>

      <footer className="sticky bottom-0 z-10 p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" disabled={isLoading}><Mic/></Button>
              <Button type="button" variant="ghost" size="icon" disabled={isLoading}><Paperclip/></Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                placeholder="তোমার নোংরা ইচ্ছাগুলো বলো..."
                className="flex-1 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="ml-2" disabled={isLoading || !input.trim()}>
                <Send />
              </Button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
