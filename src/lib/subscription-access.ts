import type { User } from '@/types';

/** True when user should get Pro-tier chat / character / model features. */
export function hasPaidSubscription(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.subscription === 'pro' && user.subscriptionStatus === 'active') return true;
  const pid = user.planId;
  if (pid === 'pro' || pid === 'premium' || pid === 'advance') {
    return user.subscriptionStatus === 'active';
  }
  return false;
}

/** Stricter than Pro: Premium / Advance plan only. */
export function hasPremiumPlan(user: User | null | undefined): boolean {
  if (!user || user.subscriptionStatus !== 'active') return false;
  return user.planId === 'premium' || user.planId === 'advance';
}

/**
 * Whether the user may chat with / open a character at this access tier.
 */
export function canAccessCharacter(
  user: User | null | undefined,
  accessTier: 'free' | 'pro' | 'premium' | undefined
): boolean {
  if (!user) return false;
  const tier = accessTier ?? 'free';
  if (tier === 'free') return true;
  if (tier === 'pro') return hasPaidSubscription(user);
  if (tier === 'premium') return hasPremiumPlan(user);
  return false;
}
