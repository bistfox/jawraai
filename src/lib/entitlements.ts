import type { PlanId } from './plans';
import { getPlan } from './plans';

export type Entitlements = {
  planId: PlanId | null;
  dailyMessageLimit: number;
  dailyImageLimit: number;
  openRouterModelSlots: number;
  groqModelSlots: number;
  characterSlots: number | 'unlimited';
  canCreateCustomCharacters: boolean;
  roleplayTier: 'basic' | 'advanced';
};

export function getEntitlements(planId?: PlanId | null): Entitlements {
  const plan = getPlan(planId);
  if (!plan) {
    return {
      planId: null,
      dailyMessageLimit: 20,
      dailyImageLimit: 1,
      openRouterModelSlots: 2,
      groqModelSlots: 0,
      characterSlots: 5,
      canCreateCustomCharacters: false,
      roleplayTier: 'basic',
    };
  }

  return {
    planId: plan.id,
    dailyMessageLimit: plan.dailyMessageLimit,
    dailyImageLimit: plan.dailyImageLimit,
    openRouterModelSlots: plan.openRouterModelSlots,
    groqModelSlots: plan.groqModelSlots,
    characterSlots: plan.characterSlots,
    canCreateCustomCharacters: plan.id === 'advance',
    roleplayTier: plan.roleplayTier,
  };
}

