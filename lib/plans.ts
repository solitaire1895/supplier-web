export type PlanType = 'free' | 'explorateur' | 'importateur' | 'partenaire';

export interface PlanFeatures {
  name: Record<string, string>;
  price: number;
  description: Record<string, string>;
  calculator: 'basic' | 'complete' | 'full';
  winningProducts: {
    limit: number | 'unlimited';
    delay: number; // in hours
    preview: boolean;
  };
  access: {
    phones: 'entry' | 'mid' | 'all';
    tablets: boolean;
    computers: 'none' | 'basic' | 'all';
    suppliers: 'platforms' | 'all';
    supplierLimit: number | 'unlimited';
    directContacts: boolean;
  };
  support: 'community' | 'priority';
  /** Partner-plan exclusive: access to the Training Center. */
  training: boolean;
}

export const PLANS: Record<PlanType, PlanFeatures> = {
  free: {
    name: {
      EN: 'Free',
      FR: 'Gratuit',
      CN: '免费'
    },
    price: 0,
    description: {
      EN: 'Test the market with limited tools.',
      FR: 'Teste le marché avec des outils limités.',
      CN: '使用有限的工具测试市场。'
    },
    calculator: 'basic',
    winningProducts: {
      limit: 0,
      delay: 72,
      preview: false,
    },
    access: {
      phones: 'entry',
      tablets: false,
      computers: 'none',
      suppliers: 'platforms',
      supplierLimit: 5,
      directContacts: false,
    },
    support: 'community',
    training: false,
  },
  explorateur: {
    name: {
      EN: 'Explorer',
      FR: 'Explorateur',
      CN: '探索者'
    },
    price: 1700,
    description: {
      EN: 'For beginners, testing the market with a limited budget.',
      FR: 'Pour débutant, teste le marché, budget limité.',
      CN: '适合预算有限的市场测试初学者。'
    },
    calculator: 'basic',
    winningProducts: {
      limit: 1,
      delay: 48,
      preview: false,
    },
    access: {
      phones: 'entry',
      tablets: false,
      computers: 'none',
      suppliers: 'platforms',
      supplierLimit: 'unlimited',
      directContacts: false,
    },
    support: 'community',
    training: false,
  },
  importateur: {
    name: {
      EN: 'Importer',
      FR: 'Importateur',
      CN: '进口商'
    },
    price: 2900,
    description: {
      EN: 'For active importers looking to scale.',
      FR: 'Pour importateur actif, veut scaler.',
      CN: '适合寻求规模化的活跃进口商。'
    },
    calculator: 'complete',
    winningProducts: {
      limit: 'unlimited',
      delay: 0,
      preview: false,
    },
    access: {
      phones: 'mid',
      tablets: true,
      computers: 'basic',
      suppliers: 'all',
      supplierLimit: 'unlimited',
      directContacts: false,
    },
    support: 'community',
    training: false,
  },
  partenaire: {
    name: {
      EN: 'Partner',
      FR: 'Partenaire',
      CN: '合伙人'
    },
    price: 4000,
    description: {
      EN: 'For serious resellers who want everything with zero friction.',
      FR: 'Pour revendeur sérieux, veut tout, zéro friction.',
      CN: '适合追求零阻力、全方位服务的资深经销商。'
    },
    calculator: 'full',
    winningProducts: {
      limit: 'unlimited',
      delay: 0,
      preview: true,
    },
    access: {
      phones: 'all',
      tablets: true,
      computers: 'all',
      suppliers: 'all',
      supplierLimit: 'unlimited',
      directContacts: true,
    },
    support: 'priority',
    training: true,
  },
};

export function getPlanFeatures(plan: string | null | undefined): PlanFeatures {
  const type = (plan?.toLowerCase() as PlanType) || 'free';
  return PLANS[type] || PLANS.free;
}

/* ================= BILLING ================= */

export const PAID_PLANS = ['explorateur', 'importateur', 'partenaire'] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

/** Days of access bought by one payment (SasPay has no recurring billing). */
export const PLAN_PERIOD_DAYS = 30;

export function isPaidPlan(plan: unknown): plan is PaidPlan {
  return typeof plan === 'string' && (PAID_PLANS as readonly string[]).includes(plan);
}

type BillingFields = {
  active_plan?: string | null;
  plan_expires_at?: string | null;
  subscription_status?: string | null;
};

export function isPlanExpired(profile: BillingFields | null | undefined): boolean {
  if (!profile?.plan_expires_at || !profile.active_plan || profile.active_plan === 'free') return false;
  return new Date(profile.plan_expires_at).getTime() <= Date.now();
}

/**
 * Returns the profile with an expired paid plan shown as 'free'.
 * Plans are prepaid periods, so access must stop at plan_expires_at even
 * before the database job (expire_lapsed_plans) has downgraded the row.
 */
export function withEffectivePlan<T extends BillingFields>(profile: T): T;
export function withEffectivePlan<T extends BillingFields>(profile: T | null | undefined): T | null | undefined;
export function withEffectivePlan<T extends BillingFields>(profile: T | null | undefined) {
  if (!profile || !isPlanExpired(profile)) return profile;
  return { ...profile, active_plan: 'free', subscription_status: 'free' };
}
