import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Smartphone, Mail, Sparkles } from 'lucide-react';

const JawraLogo = () => (
  <h1 className="font-headline text-6xl md:text-8xl font-bold text-primary animate-pulse" style={{ textShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))' }}>
    JawraAI
  </h1>
);

const AuthButtons = () => (
  <div className="flex flex-col gap-4 w-full max-w-xs">
    <Button asChild size="lg" className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg">
      <Link href="/onboarding">
        <Sparkles className="mr-2 h-5 w-5" /> Continue with Google
      </Link>
    </Button>
    <Button asChild size="lg" variant="secondary" className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg">
      <Link href="/onboarding">
        <Smartphone className="mr-2 h-5 w-5" /> Continue with Phone
      </Link>
    </Button>
    <Button asChild size="lg" variant="secondary" className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg">
      <Link href="/onboarding">
        <Mail className="mr-2 h-5 w-5" /> Continue with Email
      </Link>
    </Button>
  </div>
);

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find(p => p.id === 'login-bg');
  
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 z-0">
        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            data-ai-hint={bgImage.imageHint}
            fill
            className="object-cover opacity-20 blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="z-10 flex flex-col items-center justify-center text-center gap-8">
        <JawraLogo />
        <p className="text-xl md:text-2xl font-semibold text-accent">18+ Only – No Limits 🔥</p>
        <div className="h-8"></div>
        <AuthButtons />
        <p className="mt-4 text-muted-foreground">
          Already have an account?{' '}
          <Link href="/onboarding" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
