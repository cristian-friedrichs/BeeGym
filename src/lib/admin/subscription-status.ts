/**
 * Single source of truth for saas_subscriptions.status values.
 * These match exactly what the Kiwify webhook writes to the database.
 */

export const SUB_STATUS = {
  ACTIVE:   'ACTIVE',
  PENDING:  'PENDING',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  TRIAL:    'TRIAL',
} as const;

export type SubStatus = (typeof SUB_STATUS)[keyof typeof SUB_STATUS];

/** Statuses that represent a paying / billable subscriber (counts toward MRR & "ativos"). */
export const ACTIVE_STATUSES: SubStatus[] = [SUB_STATUS.ACTIVE, SUB_STATUS.TRIAL];

/** Statuses that represent a pending/waiting state (no payment yet). */
export const PENDING_STATUSES: SubStatus[] = [SUB_STATUS.PENDING];

/** Statuses that represent lost/churned revenue. */
export const CHURN_STATUSES: SubStatus[] = [SUB_STATUS.CANCELED, SUB_STATUS.PAST_DUE];

/** All billable + pending (used for "total assinantes" counts). */
export const ALL_BILLABLE_STATUSES: SubStatus[] = [...ACTIVE_STATUSES, ...PENDING_STATUSES];

/**
 * Trial window in days (7-day money-back guarantee).
 * Any subscription created within this window is treated as TRIAL
 * regardless of the stored status, unless it is already CANCELED/PAST_DUE.
 */
export const TRIAL_WINDOW_DAYS = 7;

/**
 * Determines whether a subscription is within the trial window.
 * A sub is "trial" when:
 *   1. Its stored status is TRIAL, OR
 *   2. It was created within the last TRIAL_WINDOW_DAYS and is ACTIVE/PENDING.
 */
export function isInTrial(status: string, createdAt: string): boolean {
  if (status === SUB_STATUS.TRIAL) return true;
  if (status === SUB_STATUS.CANCELED || status === SUB_STATUS.PAST_DUE) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= TRIAL_WINDOW_DAYS;
}
