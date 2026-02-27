'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getConversationStarters } from '@/lib/actions';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [starters, setStarters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const carouselImages = PlaceHolderImages.filter(p => p.id.startsWith('carousel'));

  useEffect(() => {
    if (user?.gender) {
      const fetchStarters = async () => {
        setIsLoading(true);
        const fetchedStarters = await getConversationStarters(user.gender);
        setStarters(fetchedStarters);
        setIsLoading(false);
      };
      fetchStarters();
    }
  }, [user?.gender]);

  const handleStartChat = (prompt: string) => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}?prompt=${encodeURIComponent(prompt)}`);
  };

  if (!user) {
    return null; // Layout handles redirect
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">
          কেমন আছো <span className="text-primary">{user.username}</span>?
        </h1>
        <p className="text-muted-foreground text-lg mt-2">আজ কী খেলবি? 😈</p>
      </header>

      <div className="flex-grow flex items-center justify-center">
        <Carousel 
          plugins={[plugin.current]}
          className="w-full max-w-4xl"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{ loop: true }}
        >
          <CarouselContent>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="overflow-hidden">
                      <Skeleton className="h-40 w-full" />
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                      <CardFooter>
                         <Skeleton className="h-10 w-full" />
                      </CardFooter>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            ) : (
              starters.map((starter, index) => {
                const img = carouselImages[index % carouselImages.length];
                return(
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="flex flex-col h-full overflow-hidden border-accent/20 hover:border-accent/80 transition-all duration-300">
                      {img && <div className="relative h-40 w-full">
                        <Image src={img.imageUrl} alt={img.description} fill className="object-cover" data-ai-hint={img.imageHint}/>
                      </div>}
                      <CardContent className="p-4 flex-grow">
                        <p className="font-semibold text-lg">{starter}</p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleStartChat(starter)} className="w-full bg-accent/90 hover:bg-accent text-accent-foreground">
                          <Sparkles className="mr-2" /> Start Chat
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CarouselItem>
              )})
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </div>
  );
}
