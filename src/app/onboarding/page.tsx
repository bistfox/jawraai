'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { User, UserRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const onboardingSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(20, 'Username must be 20 characters or less.'),
  age: z.number().min(18, 'You must be 18 or older to use this service.').max(100),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [ageValue, setAgeValue] = useState(25);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: '',
      age: 25,
    },
  });

  const onSubmit = (values: z.infer<typeof onboardingSchema>) => {
    if (!gender) {
      toast({
        title: 'Gender Required',
        description: 'Please select your gender.',
        variant: 'destructive',
      });
      return;
    }
    setUser({ ...values, gender });
    toast({
      title: `Welcome, ${values.username}!`,
      description: 'Your profile is set up. Enjoy the ride. 🔥',
    });
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardContent className="p-8">
          <h2 className="font-headline text-4xl text-center mb-2 text-primary">Join the Fold</h2>
          <p className="text-center text-muted-foreground mb-8">Let's set up your profile.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your alter ego" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age: {ageValue}</FormLabel>
                    <FormControl>
                       <Slider
                          min={13}
                          max={100}
                          step={1}
                          defaultValue={[ageValue]}
                          onValueChange={(vals) => {
                            const newAge = vals[0];
                            setAgeValue(newAge);
                            field.onChange(newAge);
                          }}
                        />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Gender</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    onClick={() => setGender('Male')}
                    className={cn(
                      'p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2',
                      gender === 'Male' ? 'border-primary bg-primary/20' : 'hover:border-primary/50'
                    )}
                  >
                    <User className="h-10 w-10 text-primary" />
                    <span className="font-semibold">I am a Man</span>
                  </Card>
                  <Card
                    onClick={() => setGender('Female')}
                    className={cn(
                      'p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2',
                      gender === 'Female' ? 'border-accent bg-accent/20' : 'hover:border-accent/50'
                    )}
                  >
                    <UserRound className="h-10 w-10 text-accent" />
                    <span className="font-semibold">I am a Woman</span>
                  </Card>
                </div>
              </div>
              
              <Button type="submit" size="lg" className="w-full text-lg">Finish</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
