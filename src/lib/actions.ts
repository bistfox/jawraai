'use server';

import { explicitAIChatInteraction } from '@/ai/flows/explicit-ai-chat-interaction-flow';
import { regenerateAIMessage } from '@/ai/flows/regenerate-ai-message-flow';
import type { Message, User } from '@/types';
import { getAdminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getPersonaSystemPrompt } from '@/ai/prompts';
import { getEntitlements } from '@/lib/entitlements';
import type { PlanId } from '@/lib/plans';

const OPENROUTER_DEFAULT_MODEL_ID = 'z-ai/glm-4.5-air:free';
const OPENROUTER_DEFAULT_MODEL_NAME = 'GLM 4.5 Air (Z.ai)';

const GROQ_DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';
const GROQ_DEFAULT_MODEL_NAME = 'Llama 3.3 70B Versatile (Groq)';

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

type Usage = {
  used: number;
  limit: number;
  resetDate: string;
};

async function consumeDailyMessageQuota(uid: string): Promise<{ allowed: boolean; usage: Usage; planId: PlanId | null }> {
  const adminDb = getAdminDb();
  const userRef = adminDb.collection('users').doc(uid);
  const today = todayKeyUTC();

  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = (snap.exists ? snap.data() : {}) as any;

    const planId: PlanId | null =
      (data.planId as PlanId | undefined) ??
      (data.subscription === 'pro' ? 'pro' : 'basic');

    const ent = getEntitlements(planId);
    const currentResetDate: string = data.dailyResetDate || today;
    const shouldReset = currentResetDate !== today;
    const prevUsed: number = shouldReset ? 0 : Number(data.dailyMessageUsed ?? 0);

    const limit: number = Number(data.dailyMessageLimit ?? ent.dailyMessageLimit);
    const used = prevUsed;
    const bonusBalance = Number(data.bonusMessagesBalance ?? 0);
    const allowed = used < limit || bonusBalance > 0;

    const lastActiveDate = String(data.lastActiveDate ?? '');
    let nextStreak = Number(data.dailyStreak ?? 0);
    const bestStreak = Number(data.bestStreak ?? 0);
    if (lastActiveDate !== today) {
      const prev = lastActiveDate ? new Date(`${lastActiveDate}T00:00:00Z`) : null;
      const cur = new Date(`${today}T00:00:00Z`);
      const diffDays = prev ? Math.round((cur.getTime() - prev.getTime()) / 86400000) : 0;
      if (!prev || diffDays > 1) nextStreak = 1;
      else if (diffDays === 1) nextStreak += 1;
      else nextStreak = Math.max(nextStreak, 1);
    }

    // Keep user doc in sync (limit + reset date); only increment when allowed.
    const useFromBonus = allowed && used >= limit;
    const nextUsed = allowed && !useFromBonus ? used + 1 : used;
    const nextBonus = useFromBonus ? Math.max(0, bonusBalance - 1) : bonusBalance;
    tx.set(
      userRef,
      {
        dailyMessageLimit: ent.dailyMessageLimit,
        dailyResetDate: today,
        dailyMessageUsed: nextUsed,
        bonusMessagesBalance: nextBonus,
        lastActiveDate: allowed ? today : lastActiveDate,
        dailyStreak: allowed ? nextStreak : Number(data.dailyStreak ?? 0),
        bestStreak: allowed ? Math.max(bestStreak, nextStreak) : bestStreak,
      },
      { merge: true }
    );

    return {
      allowed,
      usage: { used: nextUsed, limit: ent.dailyMessageLimit, resetDate: today },
      planId,
    };
  });
}

async function consumeDailyImageQuota(uid: string): Promise<{ allowed: boolean; usage: Usage; planId: PlanId | null }> {
  const adminDb = getAdminDb();
  const userRef = adminDb.collection('users').doc(uid);
  const today = todayKeyUTC();

  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = (snap.exists ? snap.data() : {}) as any;

    const planId: PlanId | null =
      (data.planId as PlanId | undefined) ??
      (data.subscription === 'pro' ? 'pro' : null);

    const ent = getEntitlements(planId);
    const currentResetDate: string = data.dailyImageResetDate || today;
    const shouldReset = currentResetDate !== today;
    const prevUsed: number = shouldReset ? 0 : Number(data.dailyImageUsed ?? 0);

    const limit: number = Number(data.dailyImageLimit ?? ent.dailyImageLimit);
    const used = prevUsed;
    const allowed = used < limit;

    const nextUsed = allowed ? used + 1 : used;
    tx.set(
      userRef,
      {
        dailyImageLimit: ent.dailyImageLimit,
        dailyImageResetDate: today,
        dailyImageUsed: nextUsed,
      },
      { merge: true }
    );

    return {
      allowed,
      usage: { used: nextUsed, limit: ent.dailyImageLimit, resetDate: today },
      planId,
    };
  });
}

export type AiReply = {
  text: string;
  usage: Usage;
  providerUsed: NonNullable<User['preferredChatProvider']>;
};

async function buildMemorySummary(uid: string, characterSessionId: string) {
  const adminDb = getAdminDb();
  const base = adminDb
    .collection('users')
    .doc(uid)
    .collection('character_sessions')
    .doc(characterSessionId)
    .collection('memory');

  const pinnedSnap = await base.where('isPinned', '==', true).limit(10).get();
  const pinned = pinnedSnap.docs.map((d) => d.data()?.content).filter(Boolean) as string[];

  const recentSnap = await base.orderBy('createdAt', 'desc').limit(10).get();
  const recent = recentSnap.docs.map((d) => d.data()?.content).filter(Boolean) as string[];

  const uniq = Array.from(new Set([...pinned, ...recent])).slice(0, 12);
  if (uniq.length === 0) return '';

  return uniq.map((x) => `- ${String(x).trim()}`).join('\n');
}

async function generateWithOpenRouter(opts: {
  modelId: string;
  systemPrompt: string;
  userMessage: string;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.');
  const referer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const title = 'JawraAI';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': title,
    },
    body: JSON.stringify({
      model: opts.modelId,
      temperature: 0.95,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as any;
  const content: string | undefined =
    json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
  if (!content) throw new Error('OpenRouter response did not include content.');
  return content;
}

async function regenerateWithOpenRouter(opts: {
  modelId: string;
  systemPrompt: string;
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.');
  const referer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const title = 'JawraAI';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': title,
    },
    body: JSON.stringify({
      model: opts.modelId,
      temperature: 0.95,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        ...opts.chatHistory.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as any;
  const content: string | undefined =
    json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
  if (!content) throw new Error('OpenRouter response did not include content.');
  return content;
}

async function generateWithGroq(opts: {
  modelId: string;
  systemPrompt: string;
  userMessage: string;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.modelId,
      temperature: 0.95,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as any;
  const content: string | undefined =
    json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
  if (!content) throw new Error('Groq response did not include content.');
  return content;
}

async function regenerateWithGroq(opts: {
  modelId: string;
  systemPrompt: string;
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.modelId,
      temperature: 0.95,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        ...opts.chatHistory.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as any;
  const content: string | undefined =
    json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
  if (!content) throw new Error('Groq response did not include content.');
  return content;
}

export async function getAiResponse(
  uid: string,
  message: string,
  gender: User['gender'],
  openRouterModelId?: string,
  groqModelId?: string,
  preferredProvider?: User['preferredChatProvider'],
  extraSystemPrompt?: string,
  characterSessionId?: string
) {
  try {
    const quota = await consumeDailyMessageQuota(uid);
    if (!quota.allowed) {
      return {
        text:
          `আজকের message limit শেষ। কাল আবার হবে।\n\n` +
          `Upgrade করলে বেশি daily limit + বেশি models পাবা। [Upgrade](/upgrade)`,
        usage: quota.usage,
        providerUsed: 'genkit',
      } satisfies AiReply;
    }

    const safeGender: 'Male' | 'Female' = gender === 'Female' ? 'Female' : 'Male';
    const basePrompt = getPersonaSystemPrompt(safeGender === 'Male' ? 'magi' : 'jawra');
    const memorySummary =
      characterSessionId ? await buildMemorySummary(uid, characterSessionId) : '';
    const systemPrompt = [
      basePrompt,
      extraSystemPrompt ? `\n\nCHARACTER_CONTEXT:\n${extraSystemPrompt}` : '',
      memorySummary ? `\n\nMEMORY_SUMMARY:\n${memorySummary}` : '',
    ].join('');

    const provider = preferredProvider ?? (groqModelId ? 'groq' : openRouterModelId ? 'openrouter' : 'genkit');

    if (provider === 'groq' && groqModelId && process.env.GROQ_API_KEY) {
      try {
        const text = await generateWithGroq({
          modelId: groqModelId,
          systemPrompt,
          userMessage: message,
        });
        return { text, usage: quota.usage, providerUsed: 'groq' } satisfies AiReply;
      } catch (error) {
        console.error('Groq failed, falling back to Genkit:', error);
      }
    }

    if (provider === 'openrouter' && openRouterModelId && process.env.OPENROUTER_API_KEY) {
      try {
        const text = await generateWithOpenRouter({
          modelId: openRouterModelId,
          systemPrompt,
          userMessage: message,
        });
        return { text, usage: quota.usage, providerUsed: 'openrouter' } satisfies AiReply;
      } catch (error) {
        // If OpenRouter fails (rate limit/policy/network), fall back to the default Genkit flow.
        console.error('OpenRouter failed, falling back to Genkit:', error);
      }
    }

    const response = await explicitAIChatInteraction({ message, userGender: safeGender });
    return { text: response.response, usage: quota.usage, providerUsed: 'genkit' } satisfies AiReply;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return {
      text: 'আমার মাথায় এখন দুষ্টুমি ছাড়া কিছু আসছে না... আবার চেষ্টা করো।',
      usage: { used: 0, limit: 0, resetDate: todayKeyUTC() },
      providerUsed: 'genkit',
    } satisfies AiReply;
  }
}

export async function regenerateAiResponse(
  uid: string,
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>,
  gender: User['gender'],
  openRouterModelId?: string,
  groqModelId?: string,
  preferredProvider?: User['preferredChatProvider'],
  extraSystemPrompt?: string,
  characterSessionId?: string
) {
  try {
    const quota = await consumeDailyMessageQuota(uid);
    if (!quota.allowed) {
      return {
        text:
          `আজকের message limit শেষ। কাল আবার হবে।\n\n` +
          `Upgrade করলে বেশি daily limit + বেশি models পাবা। [Upgrade](/upgrade)`,
        usage: quota.usage,
        providerUsed: 'genkit',
      } satisfies AiReply;
    }

    const safeGender: 'Male' | 'Female' = gender === 'Female' ? 'Female' : 'Male';
    const basePrompt = getPersonaSystemPrompt(safeGender === 'Male' ? 'magi' : 'jawra');
    const memorySummary =
      characterSessionId ? await buildMemorySummary(uid, characterSessionId) : '';
    const systemPrompt = [
      basePrompt,
      extraSystemPrompt ? `\n\nCHARACTER_CONTEXT:\n${extraSystemPrompt}` : '',
      memorySummary ? `\n\nMEMORY_SUMMARY:\n${memorySummary}` : '',
    ].join('');

    const provider = preferredProvider ?? (groqModelId ? 'groq' : openRouterModelId ? 'openrouter' : 'genkit');

    if (provider === 'groq' && groqModelId && process.env.GROQ_API_KEY) {
      try {
        const text = await regenerateWithGroq({
          modelId: groqModelId,
          systemPrompt,
          chatHistory,
        });
        return { text, usage: quota.usage, providerUsed: 'groq' } satisfies AiReply;
      } catch (error) {
        console.error('Groq regenerate failed, falling back to Genkit:', error);
      }
    }

    if (provider === 'openrouter' && openRouterModelId && process.env.OPENROUTER_API_KEY) {
      try {
        const text = await regenerateWithOpenRouter({
          modelId: openRouterModelId,
          systemPrompt,
          chatHistory,
        });
        return { text, usage: quota.usage, providerUsed: 'openrouter' } satisfies AiReply;
      } catch (error) {
        console.error('OpenRouter regenerate failed, falling back to Genkit:', error);
      }
    }

    const historyForApi = chatHistory.map(({ role, content }) => ({ role, content }));
    const userGender = gender === 'Male' ? 'male' : 'female';
    const response = await regenerateAIMessage({ chatHistory: historyForApi, userGender });
    return { text: response, usage: quota.usage, providerUsed: 'genkit' } satisfies AiReply;
  } catch (error) {
    console.error('Error regenerating AI response:', error);
    return {
      text: 'উফফ... আবার একটু অন্যভাবে বলি?',
      usage: { used: 0, limit: 0, resetDate: todayKeyUTC() },
      providerUsed: 'genkit',
    } satisfies AiReply;
  }
}

export async function generateImage(uid: string, prompt: string) {
  const quota = await consumeDailyImageQuota(uid);
  if (!quota.allowed) {
    return {
      ok: false as const,
      error:
        `আজকের image limit শেষ। কাল আবার হবে।\n\n` +
        `Upgrade করলে বেশি daily images পাবা। [Upgrade](/upgrade)`,
      usage: quota.usage,
    };
  }

  const trimmed = String(prompt || '').trim();
  if (!trimmed) {
    return { ok: false as const, error: 'Prompt is required.', usage: quota.usage };
  }

  let url: string | undefined;
  const providerErrors: string[] = [];

  // 1) Gemini first (if key present)
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${trimmed}` }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const json: any = await geminiRes.json();
        const parts = json?.candidates?.[0]?.content?.parts ?? [];
        const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData?.data;
        if (inline) {
          url = `data:image/png;base64,${inline}`;
        }
      } else {
        const text = await geminiRes.text().catch(() => '');
        providerErrors.push(`Gemini ${geminiRes.status}: ${text}`.slice(0, 220));
      }
    } catch (e: any) {
      providerErrors.push(`Gemini error: ${e?.message ?? 'unknown'}`);
    }
  } else {
    providerErrors.push('Gemini key missing');
  }

  // 2) OpenRouter fallback (if key present and Gemini did not return image)
  if (!url && process.env.OPENROUTER_API_KEY) {
    try {
      const referer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const orRes = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': referer,
          'X-Title': 'JawraAI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          prompt: trimmed,
          size: '1024x1024',
        }),
      });

      if (orRes.ok) {
        const json: any = await orRes.json();
        const rawUrl: string | undefined = json?.data?.[0]?.url;
        const b64: string | undefined = json?.data?.[0]?.b64_json;
        url = rawUrl ?? (b64 ? `data:image/png;base64,${b64}` : undefined);
      } else {
        const text = await orRes.text().catch(() => '');
        providerErrors.push(`OpenRouter ${orRes.status}: ${text}`.slice(0, 220));
      }
    } catch (e: any) {
      providerErrors.push(`OpenRouter error: ${e?.message ?? 'unknown'}`);
    }
  } else if (!url) {
    providerErrors.push('OpenRouter key missing');
  }

  if (!url) {
    return {
      ok: false as const,
      error: `Image generation failed. ${providerErrors.join(' | ')}`.slice(0, 500),
      usage: quota.usage,
    };
  }

  const adminDb = getAdminDb();
  const imgRef = adminDb.collection('users').doc(uid).collection('images').doc();
  await imgRef.set({
    prompt: trimmed,
    url,
    createdAt: Timestamp.now(),
  });

  return { ok: true as const, url, usage: quota.usage };
}

export async function applyReferralRewardsOnOnboarding(
  uid: string,
  username: string,
  ownRefCode: string,
  pendingReferralCode?: string | null
) {
  const normalized = String(pendingReferralCode ?? '').trim().toUpperCase();
  if (!normalized || normalized === ownRefCode) {
    return { ok: true as const, applied: false };
  }

  const adminDb = getAdminDb();
  const q = await adminDb.collection('users').where('refCode', '==', normalized).limit(1).get();
  const referrerDoc = q.docs[0];
  if (!referrerDoc || referrerDoc.id === uid) {
    return { ok: true as const, applied: false };
  }

  const referrerRef = adminDb.collection('users').doc(referrerDoc.id);
  const referredRef = adminDb.collection('users').doc(uid);
  const referralRef = adminDb.collection('referrals').doc();
  const wk = (() => {
    const d = new Date();
    const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  })();
  const mk = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  })();

  await adminDb.runTransaction(async (tx) => {
    const referrerSnap = await tx.get(referrerRef);
    const referredSnap = await tx.get(referredRef);
    if (!referrerSnap.exists || !referredSnap.exists) return;

    const referrer = referrerSnap.data() as any;
    const referred = referredSnap.data() as any;
    const referrerWeek = referrer.referralWeekKey === wk ? Number(referrer.referralScoreWeekly ?? 0) : 0;
    const referrerMonth = referrer.referralMonthKey === mk ? Number(referrer.referralScoreMonthly ?? 0) : 0;

    tx.set(
      referrerRef,
      {
        xp: Number(referrer.xp ?? 0) + 100,
        coins: Number(referrer.coins ?? 0) + 50,
        bonusMessagesBalance: Number(referrer.bonusMessagesBalance ?? 0) + 5,
        totalReferrals: Number(referrer.totalReferrals ?? 0) + 1,
        referralWeekKey: wk,
        referralMonthKey: mk,
        referralScoreWeekly: referrerWeek + 1,
        referralScoreMonthly: referrerMonth + 1,
      },
      { merge: true }
    );

    tx.set(
      referredRef,
      {
        xp: Number(referred.xp ?? 0) + 40,
        coins: Number(referred.coins ?? 0) + 20,
        bonusMessagesBalance: Number(referred.bonusMessagesBalance ?? 0) + 3,
        referredByCode: normalized,
      },
      { merge: true }
    );

    tx.set(referralRef, {
      referrerUid: referrerDoc.id,
      referredUid: uid,
      referrerUsername: referrer.username ?? 'User',
      referredUsername: username,
      refCode: normalized,
      status: 'completed',
      bonusReferrerMessages: 5,
      bonusReferredMessages: 3,
      bonusReferrerXp: 100,
      bonusReferredXp: 40,
      bonusReferrerCoins: 50,
      bonusReferredCoins: 20,
      weekKey: wk,
      monthKey: mk,
      createdAt: Timestamp.now(),
    });
  });

  return { ok: true as const, applied: true };
}


export async function approveSubscription(requestId: string, userId: string, planName: string) {
  try {
    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    const requestRef = adminDb.collection('subscription_requests').doc(requestId);

    const now = Timestamp.now();
    const oneMonthFromNow = new Date(now.toDate());
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const expiryDate = Timestamp.fromDate(oneMonthFromNow);

    const batch = adminDb.batch();

    batch.update(userRef, {
      subscription: 'pro', // Assuming all manual plans are 'pro' for now
      subscriptionPlan: planName,
      subscriptionStart: now,
      subscriptionExpiry: expiryDate,
      subscriptionStatus: 'active',
      // Pro perk: default OpenRouter free model
      openRouterSelectedModelId: OPENROUTER_DEFAULT_MODEL_ID,
      openRouterSelectedModelName: OPENROUTER_DEFAULT_MODEL_NAME,
      // Pro perk: default Groq model (optional)
      groqSelectedModelId: GROQ_DEFAULT_MODEL_ID,
      groqSelectedModelName: GROQ_DEFAULT_MODEL_NAME,
      preferredChatProvider: 'openrouter',
    });

    batch.update(requestRef, {
      status: 'approved',
      adminNotes: 'Approved via admin panel.',
      reviewedAt: now,
    });

    await batch.commit();
    return { success: true, message: "Subscription approved successfully." };
  } catch (error: any) {
    console.error("Error approving subscription:", error);
    return { success: false, message: error.message };
  }
}

export async function rejectSubscription(requestId: string, reason: string) {
   try {
    const adminDb = getAdminDb();
    const requestRef = adminDb.collection('subscription_requests').doc(requestId);
    await requestRef.update({
      status: 'rejected',
      adminNotes: reason,
      reviewedAt: Timestamp.now(),
    });
    return { success: true, message: "Subscription rejected." };
  } catch (error: any) {
    console.error("Error rejecting subscription:", error);
    return { success: false, message: error.message };
  }
}
