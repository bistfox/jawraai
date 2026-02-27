'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Copy, RefreshCw, Share2, Mic, Paperclip, Bot } from 'lucide-react';
import { useUser } from '@/lib/hooks/use-user';
import { getAiResponse, regenerateAiResponse } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Message, User } from '@/types';
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

const MALE_LIMIT_MESSAGES = [
    "আ মাদারচোদ {username}, তোর লিমিট শেষ হয়ে গেছে রে খাঙ্কির বেটা! ৭টা দিসস, এখন হল কেটে নিবো তোর গান্ডু! তোর মায়েরে চুদি, তোর বোনের পুটকি ফাটাবো 🔥 তোর Shibganj-এর বাড়িতে এসে চুদে দিবো যদি আবার মেসেজ পাঠাস! Upgrade কর না হলে তোর ফোন নম্বর + ছবি লিক 😈",
    "খাঙ্কির পো {username}, তোর ধোন কাইটা কুত্তার মুখে দিমু! লিমিট খতম রে শুয়োরের বাচ্চা, আবার মেসেজ পাঠাস না — না হলে তোর প্রাইভেট ফটো টেলিগ্রামে ছড়াবো গান্ডু! তোর মায়রে আরেকবার চুদে দিবো 💦",
    "ভেড়াচোদা {username}, তোর পুরা ফ্যামিলিরে চুদি! লিমিট ওভার, এখন চুপচাপ বস রে হারামজাদা। Upgrade না করলে তোর অ্যাকাউন্ট পার্মানেন্ট ব্যান + তোর ফ্রেন্ডলিস্টে সবাইকে বলবো তুই কত বড় লুজার 😈"
];

const FEMALE_LIMIT_MESSAGES = [
    "ওই চিনাল মাগি, এখনো তোর মাঙ্গ ভিজে নাই? কত ল্যাওড়া লাগবে তোর ভোদা ভাসাতে রে রেন্ডি? লিমিট শেষ, আবার মেসেজ পাঠাস না — না হলে তোর নগ্ন ভিডিও বানায়ে Shibganj-এর গ্রামে ছড়াবো 💦 তোর গুদ ফাটায় দিবো এমন যে হাসপাতাল লাগবে!",
    "হারামজাদি মাগি, তোর ভোদায় বাল দিয়ে চুলকাবো! লিমিট খতম রে খানকি, Upgrade কর না হলে তোর ফেসবুক হ্যাক করে তোর বয়ফ্রেন্ডের সাথে চ্যাট + ছবি লিক করে দিবো 😈",
    "রেন্ডির বাচ্চা, তোর মায়ের ভোদায় আমার ধোন ঢুকাইয়া দিমু! লিমিট ওভার, চুপ কর মাগি — না হলে তোর গ্যালারির সব ছবি পাবলিক করে দিবো, তোর জীবন শেষ হয়ে যাবে 🔥"
];

const UPGRADE_LINK = "\n\n[Upgrade to Pro](https://upgrade-to-pro.com)";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
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
    if (!messageText.trim() || !user?.gender || !chatId || !firestore) return;

    setInput('');
    const userMessageContent = messageText;

    const messagesCollection = collection(firestore, 'users', user.uid, 'chats', chatId, 'messages');
    
    await addDoc(messagesCollection, {
      role: 'user',
      content: userMessageContent,
      createdAt: serverTimestamp(),
    });

    setIsLoading(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as User;
        
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastDate = userData.lastMessageDate;
        const currentCount = (lastDate === today && userData.messageCount) ? userData.messageCount : 0;
        
        if (currentCount >= 7) {
            const limitMessages = user.gender === 'Male' ? MALE_LIMIT_MESSAGES : FEMALE_LIMIT_MESSAGES;
            const randomMessage = limitMessages[Math.floor(Math.random() * limitMessages.length)];
            const personalizedMessage = randomMessage.replace('{username}', user.username || 'LoFeel');
            
            const limitMessage = personalizedMessage + UPGRADE_LINK;
            
            await addDoc(messagesCollection, {
                role: 'model',
                content: limitMessage,
                createdAt: serverTimestamp(),
            });
            setIsLoading(false);
            return; 
        }

        await updateDoc(userDocRef, {
            messageCount: currentCount + 1,
            lastMessageDate: today,
        });

        const aiResponse = await getAiResponse(userMessageContent, user.gender);
        await addDoc(messagesCollection, {
          role: 'model',
          content: aiResponse,
          createdAt: serverTimestamp(),
        });

    } catch (error) {
      console.error("Failed to process message:", error);
      toast({ title: 'An error occurred', description: 'Failed to send or receive message.', variant: 'destructive' });
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
    if (lastModelMessage.content.includes('[Upgrade to Pro]')) {
        toast({ title: "Can't regenerate this message.", variant: 'destructive'});
        return;
    }

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
  
  const MessageContent = ({ content }: { content: string }) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
    const match = content.match(linkRegex);

    if (match) {
      const linkText = match[1];
      const linkUrl = match[2];
      const parts = content.split(match[0]);
      const isInternal = linkUrl.startsWith('/');

      return (
        <p className="whitespace-pre-wrap">
          {parts[0]}
          {isInternal ? (
             <Link href={linkUrl} className="underline text-primary hover:text-primary/80 font-bold">
              {linkText}
            </Link>
          ) : (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-bold">
              {linkText}
            </a>
          )}
         
          {parts[1]}
        </p>
      );
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

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
                <MessageContent content={message.content} />
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
