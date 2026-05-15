import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: {
    default: 'JawraAI — adult AI chat & characters',
    template: '%s | JawraAI',
  },
  description:
    'JawraAI: AI chat, characters, image studio, referrals, and subscriptions. 18+ platform.',
  keywords: ['JawraAI', 'AI chat', 'characters', 'Bangladesh', '18+'],
  openGraph: {
    title: 'JawraAI',
    description: 'AI chat, characters, and creative tools.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable,
          playfairDisplay.variable
        )}
      >
        <Providers>
          <div suppressHydrationWarning>
            {children}
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
