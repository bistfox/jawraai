'use client';

import { useUser } from '@/lib/hooks/use-user';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Trash2, Bot, Info } from 'lucide-react';
import type { CustomAI } from '@/types';
import Link from 'next/link';

const customAiSchema = z.object({
  provider: z.string().min(1, 'Please select an AI provider.'),
  apiKey: z.string().min(1, 'API Key cannot be empty.'),
  nickname: z.string().min(3, 'Nickname must be at least 3 characters.'),
});

const availableProviders = [
  'Dhoortho (Grok)', 
  'Mayabi (Gemini)', 
  'Khobri (DeepSeek)', 
  'Dalal (OpenRouter)', 
  'Shaitan (OpenAI)', 
  'Ghul (Claude)', 
  'Kasai (Groq)', 
  'Joutho (Together AI)'
];

const openRouterFreeModels = [
    { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Z.ai)', description: 'Lightweight, agentic, thinking mode' },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (OpenAI)', description: 'Open-weight MoE, high-reasoning' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Meta)', description: 'Multilingual, strong dialogue' },
    { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B Venice', description: 'Uncensored, creative' },
    { id: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'LFM 2.5 1.2B Thinking (LiquidAI)', description: 'Lightweight reasoning, edge-friendly' },
];

const groqModels = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'General purpose, strong chat quality' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Fast and cheap, good for quick replies' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32K', description: 'Long context, good reasoning' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', description: 'Lightweight instruction-tuned model' },
];

export default function MyAiPage() {
  const { user, refetchUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customAiSchema>>({
    resolver: zodResolver(customAiSchema),
    defaultValues: {
      provider: '',
      apiKey: '',
      nickname: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof customAiSchema>) => {
    if (!user) return;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        customAIs: arrayUnion(values),
      });
      await refetchUser();
      toast({ title: 'Success!', description: `${values.nickname} has been added.` });
      form.reset();
    } catch (error) {
      console.error("Failed to add custom AI:", error);
      toast({ title: 'Error', description: 'Could not save your custom AI.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (aiToDelete: CustomAI) => {
    if (!user || !user.customAIs) return;
    
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const updatedAIs = user.customAIs.filter(ai => ai.nickname !== aiToDelete.nickname || ai.provider !== aiToDelete.provider);
        await updateDoc(userDocRef, {
            customAIs: updatedAIs
        });
        await refetchUser();
        toast({ title: 'Removed!', description: `${aiToDelete.nickname} has been removed.` });
    } catch(error) {
        console.error("Failed to delete custom AI:", error);
        toast({ title: 'Error', description: 'Could not remove the custom AI.', variant: 'destructive' });
    }
  }

  const handleSelectOpenRouterModel = async (model: { id: string; name: string }) => {
    if (!user) return;
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        openRouterSelectedModelId: model.id,
        openRouterSelectedModelName: model.name,
      });
      await refetchUser();
      toast({ title: 'Selected!', description: `OpenRouter model set to: ${model.name}` });
    } catch (error) {
      console.error('Failed to select OpenRouter model:', error);
      toast({
        title: 'Error',
        description: 'Could not save selected model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectGroqModel = async (model: { id: string; name: string }) => {
    if (!user) return;
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        groqSelectedModelId: model.id,
        groqSelectedModelName: model.name,
        preferredChatProvider: 'groq',
      });
      await refetchUser();
      toast({ title: 'Selected!', description: `Groq model set to: ${model.name}` });
    } catch (error) {
      console.error('Failed to select Groq model:', error);
      toast({
        title: 'Error',
        description: 'Could not save selected model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  if (user.subscription !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Upgrade to Pro</CardTitle>
            <CardDescription>This feature is available for Pro users only.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Upgrade to Pro to use custom AI models, get unlimited messages, and access exclusive OpenRouter models.</p>
            <Button asChild className="mt-6">
              <Link href="/upgrade">Upgrade Now <Sparkles className="ml-2 h-4 w-4"/></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const effectiveSelectedOpenRouterId =
    user.openRouterSelectedModelId || 'z-ai/glm-4.5-air:free';

  const effectiveSelectedGroqId =
    user.groqSelectedModelId || 'llama-3.3-70b-versatile';

  const pageTitle = user.gender === 'Male' ? 'My Magi AI Pro' : 'My Jawra AI Pro';

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="font-headline text-4xl md:text-5xl">{pageTitle}</h1>
        <p className="text-muted-foreground text-lg mt-2">Manage your AI configurations.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>OpenRouter Models (Pro Perk)</CardTitle>
          <CardDescription>As a Pro user, you get access to these OpenRouter models.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {openRouterFreeModels.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-3">
                     <Bot className="h-6 w-6 text-primary" />
                     <div>
                        <p className="font-semibold text-md">{model.name}</p>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                     </div>
                  </div>
                  <Button
                    variant={effectiveSelectedOpenRouterId === model.id ? 'default' : 'outline'}
                    size="sm"
                    disabled={effectiveSelectedOpenRouterId === model.id}
                    onClick={() => handleSelectOpenRouterModel(model)}
                  >
                    {effectiveSelectedOpenRouterId === model.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Groq Models (Pro Perk)</CardTitle>
          <CardDescription>Select a Groq model for your chatbot.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groqModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-md">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                </div>
                <Button
                  variant={effectiveSelectedGroqId === model.id && user.preferredChatProvider === 'groq' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectGroqModel(model)}
                >
                  {effectiveSelectedGroqId === model.id && user.preferredChatProvider === 'groq' ? 'Selected' : 'Select'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Custom AIs</CardTitle>
          <CardDescription>The models you've configured with your own API keys.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.customAIs && user.customAIs.length > 0 ? (
            <div className="space-y-4">
              {user.customAIs.map((ai, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-4">
                     <Bot className="h-8 w-8 text-primary" />
                     <div>
                        <p className="font-bold text-lg">{ai.nickname}</p>
                        <p className="text-sm text-muted-foreground">{ai.provider}</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ai)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-muted-foreground">You haven't added any custom AI models yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add a New Custom AI</CardTitle>
          <CardDescription>Bring your own API key from various providers for unlimited access.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Super Grok" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Sparkles className="mr-2 h-4 w-4"/>
                Save Custom AI
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
