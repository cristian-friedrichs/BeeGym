export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'STAFF';

export type SubscriptionStatus =
  | 'PENDING' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED';

export type SaasSubscriptionStatus = SubscriptionStatus | 'TESTE';

export const ACTIVE_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ['ACTIVE', 'TRIAL'];

export function normalizeStatus(s?: string | null): string {
  return (s ?? '').toUpperCase().trim();
}

export function isActiveSubscription(s?: string | null): boolean {
  const norm = normalizeStatus(s);
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(norm);
}

export const SUPER_ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN'];
export const ORG_ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN'];
export const STAFF_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'INSTRUCTOR'];

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPER_ADMIN';
}

export function isOrgAdmin(role?: string | null): boolean {
  return role != null && (ORG_ADMIN_ROLES as readonly string[]).includes(role);
}

export function isStaff(role?: string | null): boolean {
  return role != null && (STAFF_ROLES as readonly string[]).includes(role);
}
