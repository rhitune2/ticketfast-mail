export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

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
  free: {
    ticketQuota: 100,
    customerQuota: 10,
    organization: {
      quota: 1,
      memberQuota: 3,
    },
  },
  pro: {
    ticketQuota: 500,
    customerQuota: 50,
    organization: {
      quota: 3,
      memberQuota: 10,
    },
  },
  enterprise: {
    ticketQuota: 2000,
    customerQuota: 200,
    organization: {
      quota: 10,
      memberQuota: 50,
    },
  },
};

/**
 * Tags for ticket categorization and management
 */
export const TAGS : string[] = [
  "SPAM",       // Unwanted messages
  "JOB",        // Employment-related tickets
  "FEEDBACK",   // User feedback
  "BUG",        // Issue reports
  "BILLING",    // Payment-related issues
  "URGENT",     // Time-sensitive matters
  "SUPPORT",
];