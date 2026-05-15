'use server';

import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import type { CharacterCategory } from '@/types';

async function requireAdmin(idToken: string): Promise<{ adminUid: string }> {
  if (!hasFirebaseAdminConfig()) {
    throw new Error('FIREBASE_ADMIN_CONFIG is not set on the server.');
  }
  const auth = getAuth();
  const decoded = await auth.verifyIdToken(idToken);
  const db = getAdminDb();
  const snap = await db.collection('admins').doc(decoded.uid).get();
  if (!snap.exists) {
    throw new Error('Forbidden: not an admin');
  }
  return { adminUid: decoded.uid };
}

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function adminBanUser(idToken: string, targetUid: string): Promise<AdminActionResult> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    await db.collection('users').doc(targetUid).set(
      {
        subscriptionStatus: 'banned',
        subscription: 'free',
        planId: 'basic',
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function adminUnbanUser(idToken: string, targetUid: string): Promise<AdminActionResult> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    await db.collection('users').doc(targetUid).set(
      {
        subscriptionStatus: 'inactive',
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function adminUpdateUserProfile(
  idToken: string,
  targetUid: string,
  patch: {
    username?: string;
    email?: string | null;
    coins?: number;
    bonusMessagesBalance?: number;
    dailyMessageLimit?: number;
    subscription?: 'free' | 'pro';
    subscriptionStatus?: 'active' | 'inactive' | 'banned';
    planId?: 'basic' | 'pro' | 'premium' | 'advance';
  }
): Promise<AdminActionResult> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const clean: Record<string, unknown> = {};
    if (patch.username !== undefined) clean.username = patch.username;
    if (patch.email !== undefined) clean.email = patch.email;
    if (patch.coins !== undefined) clean.coins = patch.coins;
    if (patch.bonusMessagesBalance !== undefined) clean.bonusMessagesBalance = patch.bonusMessagesBalance;
    if (patch.dailyMessageLimit !== undefined) clean.dailyMessageLimit = patch.dailyMessageLimit;
    if (patch.subscription !== undefined) clean.subscription = patch.subscription;
    if (patch.subscriptionStatus !== undefined) clean.subscriptionStatus = patch.subscriptionStatus;
    if (patch.planId !== undefined) clean.planId = patch.planId;
    await db.collection('users').doc(targetUid).set(clean, { merge: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function adminDeleteUser(idToken: string, targetUid: string): Promise<AdminActionResult> {
  try {
    const { adminUid } = await requireAdmin(idToken);
    if (adminUid === targetUid) {
      return { ok: false, error: 'Cannot delete your own account.' };
    }
    const db = getAdminDb();
    const userRef = db.collection('users').doc(targetUid);
    const dbWithRecursive = db as unknown as {
      recursiveDelete?: (ref: DocumentReference) => Promise<void>;
    };
    if (typeof dbWithRecursive.recursiveDelete === 'function') {
      await dbWithRecursive.recursiveDelete(userRef);
    } else {
      await userRef.delete();
    }
    try {
      await getAuth().deleteUser(targetUid);
    } catch {
      /* no auth user */
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export type AdminCharacterInput = {
  name: string;
  description: string;
  category: CharacterCategory;
  avatarUrl: string;
  greeting: string;
  systemPrompt?: string;
  visibility: 'public' | 'private';
  accessTier: 'free' | 'pro' | 'premium';
  isFeatured?: boolean;
  tags?: string[];
};

export async function adminCreateCharacter(
  idToken: string,
  input: AdminCharacterInput
): Promise<AdminActionResult & { id?: string }> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const ref = db.collection('characters').doc();
    await ref.set({
      ownerId: null,
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      avatarUrl: input.avatarUrl.trim(),
      greeting: input.greeting.trim(),
      systemPrompt: input.systemPrompt?.trim() ?? '',
      visibility: input.visibility,
      accessTier: input.accessTier,
      isFeatured: Boolean(input.isFeatured),
      tags: input.tags ?? [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function adminUpdateCharacter(
  idToken: string,
  characterId: string,
  patch: Partial<AdminCharacterInput> & { isFeatured?: boolean }
): Promise<AdminActionResult> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    const ref = db.collection('characters').doc(characterId);
    const data: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (patch.name !== undefined) data.name = patch.name.trim();
    if (patch.description !== undefined) data.description = patch.description.trim();
    if (patch.category !== undefined) data.category = patch.category;
    if (patch.avatarUrl !== undefined) data.avatarUrl = patch.avatarUrl.trim();
    if (patch.greeting !== undefined) data.greeting = patch.greeting.trim();
    if (patch.systemPrompt !== undefined) data.systemPrompt = patch.systemPrompt.trim();
    if (patch.visibility !== undefined) data.visibility = patch.visibility;
    if (patch.accessTier !== undefined) data.accessTier = patch.accessTier;
    if (patch.isFeatured !== undefined) data.isFeatured = patch.isFeatured;
    if (patch.tags !== undefined) data.tags = patch.tags;
    await ref.set(data, { merge: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function adminDeleteCharacter(idToken: string, characterId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin(idToken);
    const db = getAdminDb();
    await db.collection('characters').doc(characterId).delete();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}
