import type { Timestamp } from 'firebase/firestore';

export interface CustomAI {
  provider: string;
  apiKey: string;
  nickname: string;
}

export interface User {
  uid: string;
  id?: string;
  email?: string | null;
  emailVerified?: boolean;
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  joinDate?: Timestamp;
  xp?: number;
  level?: number;
  age?: number;
  gender?: 'Male' | 'Female';
  messageCount?: number;
  lastMessageDate?: string;
  subscription?: 'free' | 'pro';
  planId?: 'basic' | 'pro' | 'premium' | 'advance';
  customAIs?: CustomAI[];
  subscriptionPlan?: 'Basic Monthly' | 'Pro Monthly' | 'Premium Monthly';
  subscriptionExpiry?: Timestamp;
  subscriptionStatus?: 'active' | 'inactive' | 'banned';
  subscriptionStart?: Timestamp;
  dailyMessageLimit?: number;
  dailyMessageUsed?: number;
  dailyResetDate?: string; // YYYY-MM-DD
  dailyImageLimit?: number;
  dailyImageUsed?: number;
  dailyImageResetDate?: string; // YYYY-MM-DD
  bonusMessagesBalance?: number;
  coins?: number;
  dailyStreak?: number;
  bestStreak?: number;
  lastActiveDate?: string; // YYYY-MM-DD
  refCode?: string;
  referredByCode?: string;
  totalReferrals?: number;
  referralWeekKey?: string;
  referralMonthKey?: string;
  referralScoreWeekly?: number;
  referralScoreMonthly?: number;
  // Selected OpenRouter free model (Pro perk) used by chatbot
  openRouterSelectedModelId?: string;
  openRouterSelectedModelName?: string;
  // Selected GROQ model (Pro perk) used by chatbot
  groqSelectedModelId?: string;
  groqSelectedModelName?: string;
  // Which provider to use in chat (Pro perk)
  preferredChatProvider?: 'openrouter' | 'groq' | 'genkit';
  createdAt?: Timestamp;
}

/** Public weekly/monthly referral scores; written only via Admin SDK. */
export interface LeaderboardEntry {
  id: string;
  uid: string;
  username: string;
  score: number;
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referredUid: string;
  referrerUsername?: string;
  referredUsername?: string;
  refCode: string;
  status: 'completed' | 'pending';
  bonusReferrerMessages: number;
  bonusReferredMessages: number;
  bonusReferrerXp: number;
  bonusReferredXp: number;
  bonusReferrerCoins: number;
  bonusReferredCoins: number;
  weekKey: string;
  monthKey: string;
  createdAt?: Timestamp;
}

export interface GeneratedImage {
  id: string; // firestore doc id
  prompt: string;
  url: string;
  createdAt?: Timestamp;
}

export interface Message {
  id: string; // The firestore document id
  role: 'user' | 'model';
  content: string;
  createdAt: Timestamp;
}

export interface ChatSession {
  id: string; // The firestore document id
  title: string;
  createdAt: Timestamp;
  userId: string;
}

export type CharacterCategory =
  | 'Girlfriend AI'
  | 'Boyfriend AI'
  | 'Best Friend'
  | 'Therapist'
  | 'Teacher'
  | 'Anime Character'
  | 'Motivational Coach'
  | 'Funny Meme AI'
  | 'Islamic AI'
  | 'Horror Character'
  | 'Flirty Character'
  | 'Business Mentor'
  | 'Coding Assistant'
  | 'Story Writer'
  | 'Emotional Support AI';

export interface Character {
  id: string; // firestore id
  ownerId?: string | null; // null = prebuilt
  visibility: 'public' | 'private';
  category: CharacterCategory;
  name: string;
  avatarUrl: string;
  description: string;
  personalityTraits?: string[];
  speakingStyle?: string;
  mood?: string;
  greeting: string;
  tags?: string[];
  exampleConversations?: { user: string; ai: string }[];
  systemPrompt?: string;
  isFeatured?: boolean;
  /** 'free' = any logged-in user; 'pro' / 'premium' = paid tiers (see subscription-access) */
  accessTier?: 'free' | 'pro' | 'premium';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RelationshipLevel =
  | 'Stranger'
  | 'Friend'
  | 'Close Friend'
  | 'Best Friend'
  | 'Partner'
  | 'Soulmate';

export interface CharacterSession {
  id: string; // firestore id
  characterId: string;
  relationshipLevel: RelationshipLevel;
  affinityXp: number;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

export interface MemoryItem {
  id: string; // firestore id
  type: 'short' | 'long' | 'pinned' | 'emotional';
  content: string;
  isPinned?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SubscriptionRequest {
  id: string; // The firestore document id
  userId: string;
  username?: string;
  email?: string;
  // legacy label (keep for existing data)
  requestedPlan: 'Basic Monthly' | 'Pro Monthly' | 'Premium Monthly';
  planId?: 'basic' | 'pro' | 'premium' | 'advance';
  planPrice: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket';
  // The number the user was instructed to send money to (admin/merchant)
  paymentToPhoneNumber: string;
  paymentPhoneNumber: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  adminNotes?: string;
  reviewedAt?: Timestamp;
}
