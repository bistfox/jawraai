'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getConversationStarters } from '@/lib/actions';
import { Card, CardContent } from '@/components/ui/card';
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
  
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
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

  const personaName = user.gender === 'Male' ? 'Khangi AI' : 'Jawra AI';

  return (
    <div className="flex flex-col h-full p-4 md:p-8 space-y-8">
      <header>
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">
          কেমন আছো, <span className="text-primary">{user.username}</span>?
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mt-2">
          আজ তোমার <span className="font-bold text-accent">{personaName}</span>-এর সাথে কী খেলতে ইচ্ছে করছে? 😈
        </p>
      </header>

      <div className="flex-grow w-full">
          <Carousel 
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{ loop: true, align: 'start' }}
          >
            <CarouselContent className="-ml-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="p-1">
                      <Skeleton className="h-80 w-full rounded-lg" />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                starters.map((starter, index) => {
                  const img = carouselImages[index % carouselImages.length];
                  return(
                  <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1 h-full">
                      <Card className="h-80 group overflow-hidden rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 relative text-white">
                        {img && 
                          <>
                            <Image src={img.imageUrl} alt={starter} fill className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint={img.imageHint}/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </>
                        }
                        <CardContent className="absolute bottom-0 p-4 w-full z-10">
                          <p className="font-bold text-xl mb-3 line-clamp-3">{starter}</p>
                          <Button 
                            onClick={() => handleStartChat(starter)} 
                            className="w-full bg-accent/90 hover:bg-accent text-accent-foreground font-bold"
                          >
                              Start Chat <Sparkles className="ml-2 h-4 w-4"/>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                )})
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden lg:flex" />
            <CarouselNext className="hidden lg:flex" />
          </Carousel>
      </div>
    </div>
  );
}
