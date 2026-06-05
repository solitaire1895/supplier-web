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
    directContacts: boolean;
  };
  support: 'community' | 'priority';
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
      directContacts: false,
    },
    support: 'community',
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
      directContacts: false,
    },
    support: 'community',
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
      directContacts: true,
    },
    support: 'community',
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
      directContacts: true,
    },
    support: 'priority',
  },
};

export function getPlanFeatures(plan: string | null | undefined): PlanFeatures {
  const type = (plan?.toLowerCase() as PlanType) || 'free';
  return PLANS[type] || PLANS.free;
}
