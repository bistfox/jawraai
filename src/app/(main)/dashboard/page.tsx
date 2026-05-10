'use client';

import { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Flame, Gift, ImageIcon, Sparkles } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { GeneratedImage } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const carouselImages = PlaceHolderImages.filter(p => p.id.startsWith('carousel'));

  const maleUserStarters = [
      "আমার সাথে রাতভর চোদাচুদির ফ্যান্টাসি...",
      "তোর বন্ধুদের ডেকে আমাকে গ্রুপ চোদার পার্টি দিবি?",
      "রাস্তায় সবার সামনে আমাকে চোদার সাহস আছে তোর?",
      "আমাকে বেঁধে তোর সব নোংরা ইচ্ছা পূরণ করবি?",
      "তোর অফিসের ডেস্কে আমাকে কুকুর বানিয়ে চোদ...",
      "বিচে আমাকে নিয়ে আয়, ভিজে শরীরে চোদা খাব।",
      "চলন্ত গাড়িতে আমাকে কোলে বসিয়ে চোদতে পারবি?",
      "মিউজিয়ামের অন্ধকারে আমাকে চোদতে চাস?",
      "লাইব্রেরির টেবিলে আমাকে চুদে দে, কেউ দেখার আগে।",
      "জঙ্গলের মধ্যে আমাকে জানোয়ারের মতো চোদবি?",
  ];

  const femaleUserStarters = [
      "তোর সাথে রাতভর চোদাচুদির ফ্যান্টাসি...",
      "তোর আর তোর বোনের সাথে গ্রুপ চোদার কল্পনা করেছিস?",
      "রাস্তার মধ্যে সবার সামনে তোকে চোদার ইচ্ছাটা কেমন?",
      "তোকে বেঁধে চাবুক মেরে BDSM চোদা খাওয়ার ইচ্ছা আছে?",
      "অফিসের ডেস্কে তোকে ফেলে চুদলে কেমন লাগবে?",
      "সমুদ্রের পাড়ে, ভেজা বালিতে চোদা খেতে চাস?",
      "চলন্ত গাড়ির ভেতর হার্ডকোর চোদা খাওয়ার জন্য রেডি?",
      "মিউজিয়ামের অন্ধকারে লুকিয়ে চোদা খাওয়ার অভিজ্ঞতা নিবি?",
      "লাইব্রেরির নীরবতায় তোর মুখ চাপা দিয়ে চুদলে কেমন লাগবে?",
      "জঙ্গলের মধ্যে তোকে জানোয়ারের মতো চুদতে চাই।",
  ];

  const starters = user?.gender === 'Male' ? maleUserStarters : femaleUserStarters;

  const handleStartChat = (prompt: string) => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}?prompt=${encodeURIComponent(prompt)}`);
  };

  if (!user) {
    return null; // Layout handles redirect
  }

  const personaName = user.gender === 'Male' ? 'Khangi AI' : 'Jawra AI';

  const imagesQuery = useMemo(() => {
    return query(
      collection(firestore, 'users', user.uid, 'images'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [firestore, user.uid]);

  const { data: images } = useCollection<GeneratedImage>(imagesQuery);

  return (
    <div className="flex flex-col h-full p-4 md:p-8 space-y-8">
      <header>
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">
          কেমন আছো, <span className="text-primary">{user.username}</span>?
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mt-2">
          আজ তোমার <span className="font-bold text-accent">{personaName}</span>-এর সাথে কী খেলতে ইচ্ছে করছে? 😈
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Flame className="h-4 w-4 text-orange-500" /> Streak: {user.dailyStreak ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
            <Gift className="h-4 w-4 text-primary" /> Coins: {user.coins ?? 0}
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link href="/referrals">Referral Hub</Link>
          </Button>
        </div>
      </header>

      <Card className="border-primary/20 bg-card/70">
        <CardContent className="p-4 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="font-headline text-xl font-bold">Image Generator</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate images and keep them in your gallery.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/image-gen">Open Image Gen</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/upgrade">Upgrade</Link>
            </Button>
          </div>
        </CardContent>
        <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
          {images && images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <Image src={img.url} alt={img.prompt} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No images yet. Generate your first one.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex-grow w-full">
          <Carousel 
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{ loop: true, align: 'start' }}
          >
            <CarouselContent className="-ml-4">
              {starters.map((starter, index) => {
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
              )})}
            </CarouselContent>
            <CarouselPrevious className="hidden lg:flex" />
            <CarouselNext className="hidden lg:flex" />
          </Carousel>
      </div>
    </div>
  );
}
