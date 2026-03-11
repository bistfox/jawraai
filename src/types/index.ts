import type { Timestamp } from 'firebase/firestore';

export interface CustomAI {
  provider: string;
  apiKey: string;
  nickname: string;
}

export interface User {
  uid: string;
  email?: string | null;
  username?: string;
  age?: number;
  gender?: 'Male' | 'Female';
  messageCount?: number;
  lastMessageDate?: string;
  subscription?: 'free' | 'pro';
  customAIs?: CustomAI[];
  subscriptionPlan?: 'Basic Monthly' | 'Pro Monthly' | 'Premium Monthly';
  subscriptionExpiry?: Timestamp;
  subscriptionStatus?: 'active' | 'inactive';
  subscriptionStart?: Timestamp;
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
