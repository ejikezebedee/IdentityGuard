import { AuditEvent, CustomerProfile, SubscriptionPlan } from '../types';

const CUSTOMER_KEY = 'identityguard.customerProfile.v1';
const AUDIT_KEY = 'identityguard.auditEvents.v1';

const readJson = <T>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
};

const writeAudit = (event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent[] => {
  const events = readJson<AuditEvent[]>(AUDIT_KEY, []);
  const nextEvents = [
    {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event,
    },
    ...events,
  ].slice(0, 40);

  localStorage.setItem(AUDIT_KEY, JSON.stringify(nextEvents));
  return nextEvents;
};

export const accountService = {
  loadProfile(): CustomerProfile | null {
    return readJson<CustomerProfile | null>(CUSTOMER_KEY, null);
  },

  loadAuditEvents(): AuditEvent[] {
    return readJson<AuditEvent[]>(AUDIT_KEY, []);
  },

  saveProfile(profile: CustomerProfile): CustomerProfile {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(profile));
    writeAudit({
      action: 'Account updated',
      detail: `${profile.email} is configured on the ${profile.plan} plan.`,
      severity: 'Info',
    });
    return profile;
  },

  createProfile(email: string, displayName: string): CustomerProfile {
    const profile: CustomerProfile = {
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || 'IdentityGuard user',
      plan: 'Free',
      emailVerified: false,
      createdAt: Date.now(),
    };

    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(profile));
    writeAudit({
      action: 'Account created',
      detail: 'Local SaaS test profile created. Email delivery is ready for backend integration.',
      severity: 'Info',
    });
    return profile;
  },

  verifyEmail(profile: CustomerProfile): CustomerProfile {
    const nextProfile = { ...profile, emailVerified: true };
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextProfile));
    writeAudit({
      action: 'Email verified',
      detail: 'Test email verification completed for the local SaaS profile.',
      severity: 'Info',
    });
    return nextProfile;
  },

  updatePlan(profile: CustomerProfile, plan: SubscriptionPlan): CustomerProfile {
    const nextProfile = { ...profile, plan };
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextProfile));
    writeAudit({
      action: 'Plan changed',
      detail: `Subscription plan set to ${plan}. Connect a payment provider before production charging.`,
      severity: plan === 'Free' ? 'Info' : 'Warning',
    });
    return nextProfile;
  },

  recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent[] {
    return writeAudit(event);
  },
};
