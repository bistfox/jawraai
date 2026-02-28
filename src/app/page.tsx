'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Phone, Sparkles, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('দয়া করে একটি বৈধ ইমেল ঠিকানা লিখুন।'),
  password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'দয়া করে একটি বৈধ ফোন নম্বর লিখুন।'),
  otp: z.string().length(6, 'OTP অবশ্যই ৬ সংখ্যার হতে হবে।').optional(),
});

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: any;
  }
}

function JawraLogo() {
  return (
    <div className="flex flex-col items-center text-center">
      <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-primary mb-4" />
      <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))' }}>
        JawraAI
      </h1>
      <p className="text-xl md:text-2xl font-semibold text-accent mt-2">18+ Only – No Limits 🔥</p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const auth = getAuth(app);

  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState('email');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!window.recaptchaVerifier && recaptchaContainer) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
        callback: () => console.log("reCAPTCHA verified"),
        'expired-callback': () => {
          toast({ title: 'reCAPTCHA-এর মেয়াদ শেষ', description: 'অনুগ্রহ করে আবার OTP পাঠান।', variant: 'destructive' });
        }
      });
    }
  }, [auth, toast]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '', otp: '' },
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Google দিয়ে সফলভাবে সাইন ইন করেছেন!' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Google সাইন-ইন ত্রুটি', description: error.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };
  
  const handleSignUp = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: 'অ্যাকাউন্ট তৈরি সফল হয়েছে!', description: 'আপনার প্রোফাইলটি সম্পূর্ণ করুন।' });
        router.push('/onboarding');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: 'ত্রুটি', description: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। দয়া করে লগইন করুন।', variant: 'destructive' });
        } else {
            toast({ title: 'সাইন-আপ ত্রুটি', description: error.message, variant: 'destructive' });
        }
    }
    setIsLoading(false);
  };

  const handleSignIn = async (values: z.infer<typeof emailSchema>) => {
      setIsLoading(true);
      try {
          await signInWithEmailAndPassword(auth, values.email, values.password);
          toast({ title: 'স্বাগতম!' });
          router.push('/dashboard');
      } catch (error: any) {
           if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
              toast({ title: 'লগইন ত্রুটি', description: 'ভুল ইমেইল অথবা পাসওয়ার্ড।', variant: 'destructive' });
          } else {
              toast({ title: 'লগইন ত্রুটি', description: error.message, variant: 'destructive' });
          }
      }
      setIsLoading(false);
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    const appVerifier = window.recaptchaVerifier;

    if (!appVerifier) {
        toast({ title: 'ত্রুটি', description: 'reCAPTCHA প্রস্তুত নয়। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।', variant: 'destructive'});
        setIsLoading(false);
        return;
    }

    if (!otpSent) {
      const phoneNumber = `+88${values.phone}`;
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        toast({ title: 'OTP পাঠানো হয়েছে!', description: 'আপনার ফোনে ভেরিফিকেশন কোড চেক করুন।' });
      } catch (error: any) {
        console.error(error);
        toast({ title: 'ফোন সাইন-ইন ত্রুটি', description: 'OTP পাঠানো যায়নি। অনুগ্রহ করে নম্বরটি পরীক্ষা করুন বা পরে আবার চেষ্টা করুন।', variant: 'destructive' });
      }
    } else {
        if (!values.otp) {
            phoneForm.setError('otp', {message: 'অনুগ্রহ করে OTP লিখুন।'});
            setIsLoading(false);
            return;
        }
      try {
        await window.confirmationResult.confirm(values.otp);
        toast({ title: 'সফলভাবে ভেরিফাই করা হয়েছে!' });
        router.push('/dashboard');
      } catch (error: any) {
        toast({ title: 'OTP ভেরিফিকেশন ত্রুটি', description: 'আপনি যে কোডটি দিয়েছেন তা ভুল।', variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };
  
  const emailFormFields = (
    <>
        <FormField control={emailForm.control} name="email" render={({ field }) => (
            <FormItem>
                <FormLabel>ইমেইল</FormLabel>
                <FormControl><Input placeholder="you@example.com" {...field} icon={Mail} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={emailForm.control} name="password" render={({ field }) => (
            <FormItem>
                <FormLabel>পাসওয়ার্ড</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} icon={KeyRound} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
    </>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader className="text-center">
          <JawraLogo />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">ইমেইল</TabsTrigger>
              <TabsTrigger value="phone">ফোন (BD)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
                {authMode === 'signup' ? (
                    <>
                        <div className="text-center my-4">
                            <h3 className="font-semibold text-foreground text-lg">একটি অ্যাকাউন্ট তৈরি করুন</h3>
                        </div>
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(handleSignUp)} className="space-y-4">
                                {emailFormFields}
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'প্রসেসিং...' : 'অ্যাকাউন্ট তৈরি করুন'}</Button>
                            </form>
                        </Form>
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            আপনার কি অ্যাকাউন্ট আছে?{' '}
                            <button onClick={() => { setAuthMode('login'); emailForm.reset(); }} className="underline font-semibold text-primary hover:text-primary/80">
                                লগইন করুন
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-center my-4">
                            <h3 className="font-semibold text-foreground text-lg">আপনার অ্যাকাউন্টে লগইন করুন</h3>
                        </div>
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(handleSignIn)} className="space-y-4">
                                {emailFormFields}
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'প্রসেসিং...' : 'লগইন করুন'}</Button>
                            </form>
                        </Form>
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            অ্যাকাউন্ট নেই?{' '}
                            <button onClick={() => { setAuthMode('signup'); emailForm.reset(); }} className="underline font-semibold text-primary hover:text-primary/80">
                                একটি অ্যাকাউন্ট তৈরি করুন
                            </button>
                        </p>
                    </>
                )}
            </TabsContent>

            <TabsContent value="phone">
               <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                  {!otpSent ? (
                    <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ফোন নম্বর</FormLabel>
                        <div className="flex items-center">
                            <span className="border border-r-0 rounded-l-md px-3 py-2 bg-muted text-muted-foreground">+88</span>
                            <Input {...field} placeholder="01xxxxxxxxx" className="rounded-l-none" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ) : (
                    <FormField control={phoneForm.control} name="otp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ভেরিফিকেশন কোড (OTP)</FormLabel>
                        <FormControl><Input placeholder="123456" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'প্রসেসিং...' : (otpSent ? 'OTP ভেরিফাই করুন' : 'OTP পাঠান')}</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">অথবা এর মাধ্যমে চালিয়ে যান</span></div>
          </div>
          
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isLoading}>
            <Sparkles className="mr-2 h-5 w-5 text-primary" /> Google দিয়ে চালিয়ে যান
          </Button>

          <div id="recaptcha-container"></div>
        </CardContent>
      </Card>
    </main>
  );
}
