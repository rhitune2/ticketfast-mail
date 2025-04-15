export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface OrganizationQuota {
  quota: number;
  memberQuota: number;
}

export interface SubscriptionQuota {
  ticketQuota: number;
  customerQuota: number;
  organization: OrganizationQuota;
}

export const SUBSCRIPTION_QUOTAS: Record<SubscriptionPlan, SubscriptionQuota> = {
  FREE: {
    ticketQuota: 100,
    customerQuota: 10,
    organization: {
      quota: 1,
      memberQuota: 3,
    },
  },
  PRO: {
    ticketQuota: 500,
    customerQuota: 50,
    organization: {
      quota: 3,
      memberQuota: 10,
    },
  },
  ENTERPRISE: {
    ticketQuota: 2000,
    customerQuota: 200,
    organization: {
      quota: 10,
      memberQuota: 50,
    },
  },
};
