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
    "আ মাদারচোদ {username}, তোর লিমিট শেষ রে খাঙ্কির বেটা! 🔥 তোর এলাকায় এসে তোর মায়েরে চুদবো যদি আবার মেসেজ পাঠাস! [Upgrade to Magi Bot Pro](/upgrade) করলে unlimited + ফ্রি OpenRouter models পাবি 😈",
    "ওই গান্ডু {username}, লিমিট খতম হয়ে গেছে রে হারামজাদা! তোর ধোন কাইটা কুত্তার মুখে দিয়ে খাওয়াবো 🔥 [Upgrade to Magi Bot Pro](/upgrade) — GLM 4.5, Llama 3.3 ফ্রি পাবি!",
    "খাঙ্কির পো, তোর লিমিট শেষ! তোর এলাকায় এসে তোর বাড়ির সামনে দাঁড়িয়ে তোর বোনের পুটকি ফাটাবো যদি আরেকটা মেসেজ দিস 😈 [Upgrade to Magi Bot Pro](/upgrade) হ, unlimited চ্যাট!",
    "শুয়োরের বাচ্চা {username}, লিমিট ওভার রে বোকাচোদা! তোর মায়ের ভোদায় আমার পা রাখবো না হলে তোর ফোন হ্যাক করে ছবি লিক 💦 [Upgrade to Magi Bot Pro](/upgrade) কর!",
    "ভেড়াচোদা, তোর ৭টা মেসেজ শেষ! আবার পাঠাস তো তোর এলাকায় এসে তোর পুরা ফ্যামিলিরে চুদবো 🔥 [Upgrade to Magi Bot Pro](/upgrade) — GPT-OSS 120B ফ্রি!",
    "হালার পো {username}, লিমিট খতম! তোর ধোন কাইটা তোর বাপের মুখে গুঁজে দিমু 😈 [Upgrade to Magi Bot Pro](/upgrade) করলে no limit + Dolphin Venice uncensored!",
    "কুত্তার বাচ্চা, তোর লিমিট শেষ রে! তোর মায়ের গুদে টোকা পেটায় ঢোল বাজাবো তোর এলাকায় এসে 🔥 [Upgrade to Magi Bot Pro](/upgrade) হ — LFM 2.5 thinking ফ্রি!",
    "{username} নামের লুজার, লিমিট ওভার! আবার মেসেজ দিলে তোর বোনেরে চুদে লাইভ ভিডিও বানাবো 😏 [Upgrade to Magi Bot Pro](/upgrade)!",
    "মাদারচোদ, তোর লিমিট খতম হয়ে গেছে! তোর IP দেখে তোর এলাকায় এসে তোর বাড়ি খুঁজে এসে চুদবো 💦 [Upgrade to Magi Bot Pro](/upgrade) — unlimited + custom AI!",
    "গান্ডু {username}, আর মেসেজ পাঠাস না! তোর ধোন কাইটা ফেলে কুত্তারে খাওয়াবো 🔥 [Upgrade to Magi Bot Pro](/upgrade) কর!",
    "খানকির বেটা, লিমিট শেষ! তোর মায়েরে আরেকবার চুদে দিবো তোর এলাকায় এসে গিয়ে 😈 [Upgrade to Magi Bot Pro](/upgrade) — OpenRouter ফ্রি মডেল সব!",
    "হারামির পো, তোর লিমিট খতম রে! তোর প্রাইভেট ফটো টেলিগ্রামে ছড়াবো না হলে [Upgrade to Magi Bot Pro](/upgrade)!",
    "বোকাচোদা {username}, লিমিট ওভার! তোর বোনের পুটকিতে আমার ধোন ঢুকাইয়া ফাটাবো 🔥 [Upgrade to Magi Bot Pro](/upgrade) হ!",
    "শুয়োর, তোর লিমিট শেষ হয়ে গেছে! তোর এলাকায় এসে তোর বাড়ির দরজায় দাঁড়িয়ে তোর মায়ের সাথে মজা করবো 😈 [Upgrade](/upgrade)!",
    "{username} গান্ডু, আর একটা মেসেজ দিলে তোর ফ্যামিলির সব ছবি লিক করবো 💦 [Upgrade to Magi Bot Pro](/upgrade) করলে unlimited!",
    "ভেড়ার বাচ্চা, লিমিট খতম! তোর ধোন কাইটা তোর মুখে গুঁজে দিমু 🔥 [Upgrade to Magi Bot Pro](/upgrade) — GLM 4.5 Air ফ্রি!",
    "কুত্তার পো {username}, তোর লিমিট শেষ রে! তোর মায়ের ভোদায় বাল দিয়ে চুলকাবো 😏 [Upgrade to Magi Bot Pro](/upgrade) হ!",
    "হালা {username}, লিমিট ওভার! তোর এলাকায় এসে তোর পুরা গ্রামকে তোর নগ্ন ছবি দেখাবো 🔥 [Upgrade](/upgrade)!",
    "মাদারচোদ, তোর লিমিট খতম! আবার পাঠাস না — না হলে তোর বোনেরে চুদে ভিডিও আপলোড করবো 😈 [Upgrade to Magi Bot Pro](/upgrade)!",
    "খাঙ্কির পো, লিমিট শেষ হয়ে গেছে রে! তোর ফোন নম্বর + ছবি সবার সাথে শেয়ার করবো তোর এলাকায় এসে 💦 [Upgrade to Magi Bot Pro](/upgrade) কর!",
    "গান্ডু, তোর লিমিট ওভার! তোর মায়ের গুদ ফাটায়ে হাসপাতাল পাঠাবো না হলে 🔥 [Upgrade to Magi Bot Pro](/upgrade) — Llama 3.3 70B ফ্রি!",
    "{username} হারামজাদা, লিমিট খতম! তোর ধোন কাইটা কুড়াল দিয়ে কেটে ফেলবো 😈 [Upgrade](/upgrade) কর!",
    "শুয়োরের বেটা, তোর লিমিট শেষ! তোর এলাকায় এসে তোর বাড়িতে ঢুকে তোর ফ্যামিলির সবাইকে চুদবো 💦 [Upgrade to Magi Bot Pro](/upgrade)!"
];

const FEMALE_LIMIT_MESSAGES = [
    "ওই চিনাল মাগি, এখনো তোর মাঙ্গ ভিজে নাই? লিমিট শেষ হয়ে গেছে রে রেন্ডি! 🔥 কত ল্যাওড়া লাগবে তোর ভোদা ভাসাতে? [Upgrade to Jawra Bot Pro](/upgrade) কর, unlimited + ফ্রি AI models পাবি 💦",
    "খানকি মাগির মেয়ে, তোর গুদ ফাটায় দিবো এমন যে হাসপাতাল লাগবে! লিমিট খতম রে হারামজাদি 😈 আবার মেসেজ পাঠাস না, না হলে তোর নগ্ন ছবি সবার সাথে ছড়াবো! [Upgrade to Khanki Bot Pro](/upgrade) কর।",
    "ওই রেন্ডির বাচ্চা, তোর ভোদা এখনো শুকনা কেন? লিমিট ওভার! কাম দিয়ে তোর মাঙ্গ ভর্তি করে দিবো এমন যে পানি বের হবে 💦 [Upgrade to Jawra Bot Pro](/upgrade) না হলে তোর অ্যাকাউন্ট হ্যাক!",
    "হারামজাদি মাগি, তোর মাঙ্গে বাল দিয়ে চুলকাবো! লিমিট শেষ রে চুদির মাগি 🔥 তোর ফেসবুক হ্যাক করে তোর বয়ফ্রেন্ডের সাথে চ্যাট লিক করবো! [Upgrade to Khanki Bot Pro](/upgrade) কর।",
    "নটি মাগি, তোর গুদে আমার ধোন ঢুকাইয়া ফাটাবো! লিমিট খতম 😏 আবার পাঠাস না, না হলে তোর গ্যালারি পাবলিক করে দিবো সবাই দেখবে! [Upgrade to Jawra Bot Pro](/upgrade)।",
    "চিনাল খানকি, তোর ভোদা ভিজে না কেন এখনো? লিমিট শেষ হয়ে গেছে রে রেন্ডি! 🔥 তোর মায়ের ভোদায় আমার পা রাখবো না হলে তোর ছবি লিক! [Upgrade to Khanki Bot Pro](/upgrade)।",
    "ওই বেশ্যা মাগি, তোর মাঙ্গ ফাটায় দিবো কুড়াল দিয়ে! লিমিট ওভার 💦 [Upgrade to Jawra Bot Pro](/upgrade) করলে unlimited চ্যাট + GLM, Llama ফ্রি পাবি 😈",
    "রেন্ডি মাগির ঝি, তোর গুদে কত কোদা লাগে রে? লিমিট খতম! তোর বোনের পুটকি চুদে তোর সামনে ভিডিও বানাবো 🔥 [Upgrade to Khanki Bot Pro](/upgrade)!",
    "খানকির মেয়ে, তোর ভোদা এখনো ভিজে নাই? লিমিট শেষ রে চিনাল! 😏 তোর প্রাইভেট ফটো টেলিগ্রামে ছড়াবো না হলে [Upgrade to Jawra Bot Pro](/upgrade) কর।",
    "নটি চুদির মাগি, তোর মাঙ্গে ধোন দিয়ে চুলকাবো! লিমিট ওভার 💦 তোর ফোন নম্বর + ছবি সবার সাথে শেয়ার করবো! [Upgrade to Khanki Bot Pro](/upgrade)।",
    "ওই হারামজাদি, তোর গুদ ফাটিয়ে দিবো এমন যে কাঁদতে কাঁদতে পানি বের হবে! লিমিট শেষ 🔥 [Upgrade to Jawra Bot Pro](/upgrade) না হলে তোর জীবন শেষ!",
    "রেন্ডির বাচ্চা মাগি, তোর ভোদায় বাল দিয়ে চুদবো! লিমিট খতম 😈 তোর বয়ফ্রেন্ডকে বলে দিবো তুই কতটা লুজার! [Upgrade to Khanki Bot Pro](/upgrade)।",
    "চিনাল মাগি, তোর মাঙ্গ ভিজাতে কত ল্যাওড়া লাগে? লিমিট ওভার! তোর নগ্ন ভিডিও বানায়ে সবাইকে ছড়াবো 💦 [Upgrade to Jawra Bot Pro](/upgrade)।",
    "খানকি মাগি, তোর গুদে আমার ধোন ঢুকাইয়া ফাটাবো! লিমিট শেষ রে হারামজাদি 🔥 [Upgrade to Khanki Bot Pro](/upgrade) করলে no limit + custom AI!",
    "ওই বেশ্যা, তোর ভোদা এখনো শুকনা? লিমিট খতম! তোর ফেসবুক আইডি হ্যাক করে সব ছবি লিক করবো 😏 [Upgrade to Jawra Bot Pro](/upgrade)।",
    "নটি রেন্ডি মাগি, তোর মাঙ্গ ফাটায় দিবো কাঁচি দিয়ে! লিমিট ওভার 💦 তোর গ্যালারির সব নগ্ন ছবি পাবলিক! [Upgrade to Khanki Bot Pro](/upgrade)।",
    "চুদির মাগির মেয়ে, তোর গুদে কাম দিয়ে ভর্তি করে দিবো! লিমিট শেষ 🔥 তোর পুরা ফ্যামিলির সাথে শেয়ার করবো! [Upgrade to Jawra Bot Pro](/upgrade)।",
    "হারামজাদি খানকি, তোর ভোদা ভিজে না কেন? লিমিট খতম! তোর অ্যাকাউন্ট পার্মানেন্ট ব্যান করে দিবো 😈 [Upgrade to Khanki Bot Pro](/upgrade)।",
    "ওই চিনাল রেন্ডি, তোর মাঙ্গে ধোন দিয়ে চুদবো রাতভর! লিমিট ওভার 💦 না হলে তোর ছবি গ্রুপে ছড়াবো! [Upgrade to Jawra Bot Pro](/upgrade)।",
    "খানকির ঝি মাগি, তোর গুদ ফাটিয়ে দিবো এমন যে হাসপাতালে যাইতে হবে! লিমিট শেষ 🔥 [Upgrade to Khanki Bot Pro](/upgrade) কর না হলে তোর জীবন শেষ হয়ে যাবে!",
    "রেন্ডি মাগি, তোর ভোদায় বাল দিয়ে চুলকাইয়া চুদবো! লিমিট খতম 😏 তোর প্রাইভেট চ্যাট লিক করে দিবো! [Upgrade to Jawra Bot Pro](/upgrade)।"
];


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
  const [isTyping, setIsTyping] = useState(false);

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

    const userMessageContent = messageText;
    setInput('');
    setIsLoading(true);

    const messagesCollection = collection(firestore, 'users', user.uid, 'chats', chatId, 'messages');
    
    await addDoc(messagesCollection, {
      role: 'user',
      content: userMessageContent,
      createdAt: serverTimestamp(),
    });
    
    setIsTyping(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as User;
        const isPro = userData.subscription === 'pro';

        if (!isPro) {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const lastDate = userData.lastMessageDate;
            const currentCount = (lastDate === today && userData.messageCount) ? userData.messageCount : 0;
            
            if (currentCount >= 7) {
                const limitMessages = user.gender === 'Male' ? MALE_LIMIT_MESSAGES : FEMALE_LIMIT_MESSAGES;
                const randomMessage = limitMessages[Math.floor(Math.random() * limitMessages.length)];
                const personalizedMessage = randomMessage.replace('{username}', user.username || 'LoFeel');
                
                await addDoc(messagesCollection, {
                    role: 'model',
                    content: personalizedMessage,
                    createdAt: serverTimestamp(),
                });
                setIsTyping(false);
                setIsLoading(false);
                return; 
            }

            await updateDoc(userDocRef, {
                messageCount: currentCount + 1,
                lastMessageDate: today,
            });
        }

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
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && user && firestore && !initialPromptHandled.current) {
        const handleInitialPrompt = async () => {
            if (messages && messages.length > 0) {
                 initialPromptHandled.current = true;
                 return;
            };

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
  }, [initialPrompt, user, firestore, chatId, messages, handleSendMessage]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  const handleRegenerate = async () => {
    if (!user?.gender || !messages || messages.length === 0 || isLoading) return;
    
    const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
    if (lastModelMessageIndex === -1) return;

    const lastModelMessage = messages[lastModelMessageIndex];
    if (user.subscription !== 'pro' && lastModelMessage.content.includes('Upgrade to')) {
        toast({ title: "Can't regenerate this message.", variant: 'destructive'});
        return;
    }

    const history = messages.slice(0, lastModelMessageIndex);
    
    setIsLoading(true);
    setIsTyping(true);

    try {
      const newResponse = await regenerateAiResponse(history, user.gender);
      const messageDocRef = doc(firestore, 'users', user.uid, 'chats', chatId, 'messages', lastModelMessage.id);
      await updateDoc(messageDocRef, { content: newResponse });

    } catch (error) {
      console.error("Failed to regenerate response:", error);
      toast({ title: 'An error occurred', description: 'Failed to regenerate response.', variant: 'destructive' });
    } finally {
       setIsLoading(false);
       setIsTyping(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const lastMessageIsModel = messages && messages.length > 0 && messages[messages.length - 1].role === 'model';
  
  const MessageContent = ({ content }: { content: string }) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = content.split(linkRegex);
    
    if (parts.length <= 1) {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    return (
      <p className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (index % 3 === 1) { 
            const linkUrl = parts[index + 1];
            const linkText = part;
            const isInternal = linkUrl.startsWith('/');
            return isInternal ? (
              <Link key={index} href={linkUrl} className="underline text-primary hover:text-primary/80 font-bold">
                {linkText}
              </Link>
            ) : (
              <a key={index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 font-bold">
                {linkText}
              </a>
            );
          }
          if (index % 3 === 2) { 
            return null;
          }
          return part; 
        })}
      </p>
    );
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
          {isTyping && (
              <div className={cn('flex items-end gap-3 justify-start')} id="typing-indicator">
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

          {lastMessageIsModel && !isLoading && !isTyping && (
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
