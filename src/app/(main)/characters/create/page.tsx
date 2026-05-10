'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/lib/hooks/use-user';
import { getEntitlements } from '@/lib/entitlements';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CharacterCategory } from '@/types';

const categories: CharacterCategory[] = [
  'Girlfriend AI',
  'Boyfriend AI',
  'Best Friend',
  'Therapist',
  'Teacher',
  'Anime Character',
  'Motivational Coach',
  'Funny Meme AI',
  'Islamic AI',
  'Horror Character',
  'Flirty Character',
  'Business Mentor',
  'Coding Assistant',
  'Story Writer',
  'Emotional Support AI',
];

const schema = z.object({
  name: z.string().min(2).max(40),
  category: z.enum(categories as any),
  description: z.string().min(10).max(240),
  avatarUrl: z.string().url().optional(),
  visibility: z.enum(['public', 'private']),
  greeting: z.string().min(5).max(200),
});

export default function CharacterCreatePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const ent = getEntitlements((user?.planId ?? null) as any);
  const canCreate = ent.canCreateCustomCharacters;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'Best Friend',
      description: '',
      avatarUrl: '',
      visibility: 'private',
      greeting: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    if (!canCreate) {
      toast({ title: 'Upgrade required', description: 'Character creator is available for ADVANCE plan.', variant: 'destructive' });
      router.push('/upgrade');
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, 'characters'), {
        ownerId: user.uid,
        visibility: values.visibility,
        category: values.category,
        name: values.name,
        avatarUrl: values.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(values.name)}`,
        description: values.description,
        greeting: values.greeting,
        tags: [],
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Created', description: 'Character created successfully.' });
      router.push(`/characters/${docRef.id}`);
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (!user) return null;

  if (!canCreate) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Character Creator (ADVANCE)</CardTitle>
            <CardDescription>Upgrade to ADVANCE to fully customize and create characters.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/upgrade">Upgrade</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/characters">Browse characters</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl">Create Character</h1>
          <p className="text-muted-foreground text-lg mt-2">Build a private or public persona.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/characters">Back</Link>
        </Button>
      </header>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Luna" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Short description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="greeting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Greeting message</FormLabel>
                    <FormControl>
                      <Input placeholder="First message this character says" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

