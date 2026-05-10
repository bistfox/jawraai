export type PlanId = 'basic' | 'pro' | 'premium' | 'advance';

export type ChatProvider = 'openrouter' | 'groq' | 'genkit';

export type PlanConfig = {
  id: PlanId;
  name: string;
  priceBDT: number;
  priceSuffix: string;
  description: string;
  isPopular?: boolean;
  dailyMessageLimit: number;
  dailyImageLimit: number;
  openRouterModelSlots: number; // how many OpenRouter models are selectable
  groqModelSlots: number; // how many Groq models are selectable
  characterSlots: number | 'unlimited';
  memoryTier: 'basic' | 'better' | 'smart';
  speedTier: 'standard' | 'fast' | 'priority' | 'max';
  roleplayTier: 'basic' | 'advanced';
  features: string[];
};

export const PLANS: Record<PlanId, PlanConfig> = {
  basic: {
    id: 'basic',
    name: 'BASIC',
    priceBDT: 149,
    priceSuffix: '/ month',
    description: 'Start your journey with essential features.',
    dailyMessageLimit: 20,
    dailyImageLimit: 3,
    openRouterModelSlots: 2,
    groqModelSlots: 0,
    characterSlots: 5,
    memoryTier: 'basic',
    speedTier: 'standard',
    roleplayTier: 'basic',
    features: [
      '20 AI messages daily',
      'Access to 2 OpenRouter models',
      'Access to 5 custom characters',
      'Basic memory',
      'Standard speed',
      'Limited image generation',
    ],
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    priceBDT: 349,
    priceSuffix: '/ month',
    description: 'For power users who want more models and characters.',
    isPopular: true,
    dailyMessageLimit: 40,
    dailyImageLimit: 5,
    openRouterModelSlots: 5,
    groqModelSlots: 0,
    characterSlots: 15,
    memoryTier: 'better',
    speedTier: 'fast',
    roleplayTier: 'basic',
    features: [
      '40 AI messages daily',
      'Access to 5 OpenRouter models',
      'Access to 15 premium characters',
      'Faster response speed',
      'Better memory system',
      'Early access features',
    ],
  },
  premium: {
    id: 'premium',
    name: 'PREMIUM',
    priceBDT: 549,
    priceSuffix: '/ month',
    description: 'Maximum creativity, priority speed and advanced roleplay.',
    dailyMessageLimit: 60,
    dailyImageLimit: 12,
    openRouterModelSlots: 999, // treated as "all"
    groqModelSlots: 3,
    characterSlots: 'unlimited',
    memoryTier: 'smart',
    speedTier: 'priority',
    roleplayTier: 'advanced',
    features: [
      '60 AI messages daily',
      'Access to all OpenRouter models',
      'Access to 3 Groq models',
      'Unlimited characters',
      'Smart memory system',
      'Priority AI speed',
      'Premium creative mode',
      'Advanced roleplay',
    ],
  },
  advance: {
    id: 'advance',
    name: 'ADVANCE AI',
    priceBDT: 999,
    priceSuffix: '/ month',
    description: 'Full customization, experimental tools, maximum priority.',
    dailyMessageLimit: 120,
    dailyImageLimit: 20,
    openRouterModelSlots: 999,
    groqModelSlots: 999,
    characterSlots: 'unlimited',
    memoryTier: 'smart',
    speedTier: 'max',
    roleplayTier: 'advanced',
    features: [
      '120 AI messages daily',
      'Access to all OpenRouter models',
      'Access to all Groq models',
      'Custom AI character builder',
      'Upload custom prompts',
      'AI behavior customization',
      'Experimental AI tools',
      'Future feature access',
      'Maximum priority speed',
    ],
  },
};

export const PLAN_LIST: PlanConfig[] = [
  PLANS.basic,
  PLANS.pro,
  PLANS.premium,
  PLANS.advance,
];

export function getPlan(planId?: PlanId | null) {
  if (!planId) return null;
  return PLANS[planId] ?? null;
}

