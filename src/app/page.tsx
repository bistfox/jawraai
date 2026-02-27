'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Auth as FirebaseAuth } from 'firebase/auth';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  otp: z.string().length(6, 'OTP must be 6 digits.').optional(),
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
      <Bot className="w-16 h-16 text-primary mb-4" />
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
  const [otpSent, setOtpSent] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '', otp: '' },
  });

  const setupRecaptcha = (authInstance: FirebaseAuth) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Successfully signed in with Google!' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Google Sign-In Error', description: error.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };
  
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Account created successfully!', description: 'Please complete your profile.' });
      router.push('/onboarding');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, values.email, values.password);
          toast({ title: 'Welcome back!' });
          router.push('/dashboard');
        } catch (signInError: any) {
          toast({ title: 'Sign-in Error', description: signInError.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Sign-up Error', description: error.message, variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    setupRecaptcha(auth);
    const appVerifier = window.recaptchaVerifier!;

    if (!otpSent) {
      const phoneNumber = `+88${values.phone}`;
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Check your phone for the verification code.' });
      } catch (error: any) {
        console.error(error);
        toast({ title: 'Phone Sign-in Error', description: 'Could not send OTP. Please check the number or try again later.', variant: 'destructive' });
        appVerifier.render().then((widgetId) => {
            // @ts-ignore
            grecaptcha.reset(widgetId);
        });
      }
    } else {
        if (!values.otp) {
            phoneForm.setError('otp', {message: 'Please enter the OTP.'});
            setIsLoading(false);
            return;
        }
      try {
        await window.confirmationResult.confirm(values.otp);
        toast({ title: 'Successfully verified!' });
        router.push('/dashboard');
      } catch (error: any) {
        toast({ title: 'OTP Verification Error', description: 'The code you entered is invalid.', variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader className="text-center">
          <JawraLogo />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone (BD)</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
                  <FormField control={emailForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} icon={Mail} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={emailForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} icon={KeyRound} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Processing...' : 'Continue with Email'}</Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="phone">
               <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                  {!otpSent ? (
                    <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
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
                        <FormLabel>Verification Code (OTP)</FormLabel>
                        <FormControl><Input placeholder="123456" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Processing...' : (otpSent ? 'Verify OTP' : 'Send OTP')}</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isLoading}>
            <Sparkles className="mr-2 h-5 w-5 text-primary" /> Continue with Google
          </Button>

          <div id="recaptcha-container"></div>
        </CardContent>
      </Card>
    </main>
  );
}
