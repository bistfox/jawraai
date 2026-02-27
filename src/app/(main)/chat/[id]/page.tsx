'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function ChatPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const persona = user?.gender === 'Male' 
    ? { name: 'Khangi AI', avatarId: 'khangi-ai-avatar' }
    : { name: 'Jawra AI', avatarId: 'jawra-ai-avatar' };
  
  const personaAvatar = PlaceHolderImages.find(p => p.id === persona.avatarId);
  
  const scrollToBottom = () => {
    setTimeout(() => {
        const scrollableViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTo({ top: scrollableViewport.scrollHeight, behavior: 'smooth' });
        }
    }, 100);
  };

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current) {
      initialPromptSent.current = true;
      handleSendMessage(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user?.gender) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    
    const aiMessagePlaceholder: Message = { id: crypto.randomUUID(), role: 'model', content: '' };
    setMessages(prev => [...prev, aiMessagePlaceholder]);

    try {
        const aiResponse = await getAiResponse(messageText, user.gender);
        const aiMessageId = aiMessagePlaceholder.id;
        
        let index = 0;
        function type() {
            if (index < aiResponse.length) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, content: aiResponse.substring(0, index + 1) }
                            : msg
                    )
                );
                index++;
                setTimeout(type, 20);
            } else {
                setIsLoading(false);
            }
        }
        type();

    } catch (error) {
        console.error("Failed to get AI response:", error);
        toast({ title: 'An error occurred', description: 'Failed to get response from AI.', variant: 'destructive' });
        setMessages(prev => prev.filter(msg => msg.id !== aiMessagePlaceholder.id));
        setIsLoading(false);
    }
  };
  
  const handleRegenerate = async (messageId: string) => {
    if (!user?.gender) return;
    
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'model') return;

    const history = messages.slice(0, messageIndex);
    
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, content: '' } : msg));
    setIsLoading(true);

    try {
      const newResponse = await regenerateAiResponse(history, user.gender);
      
      let index = 0;
      function type() {
        if (index < newResponse.length) {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, content: newResponse.substring(0, index + 1) }
                        : msg
                )
            );
            index++;
            setTimeout(type, 20);
        } else {
            setIsLoading(false);
        }
      }
      type();
    } catch (error) {
      console.error("Failed to regenerate response:", error);
      toast({ title: 'An error occurred', description: 'Failed to regenerate response.', variant: 'destructive' });
      setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, content: "Sorry, I couldn't think of a different response."} : msg))
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
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
          {messages.map((message) => (
            <div key={message.id} className={cn('flex items-end gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'model' && (
                <Avatar className="h-8 w-8">
                  {personaAvatar && <AvatarImage src={personaAvatar.imageUrl} alt={persona.name} />}
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[75%] rounded-lg p-3 text-white', message.role === 'user' ? 'bg-primary' : 'bg-secondary')}>
                {message.role === 'model' && message.content === '' && isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                
                {message.role === 'model' && message.content !== '' && !isLoading && (
                  <div className="flex gap-2 mt-2 border-t border-white/10 pt-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRegenerate(message.id)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: 'Share feature coming soon!' })}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
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
