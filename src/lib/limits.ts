import type { Account, LimitKind, LimitMode, LimitState } from "./types";

export const DEFAULT_LIMIT: LimitState = { usagePercent: 0 };

export function clampPercent(value: unknown): number {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

export function createLimit(usagePercent: unknown = 0, resetsAt?: string): LimitState {
  return {
    usagePercent: clampPercent(usagePercent),
    ...(resetsAt ? { resetsAt } : {}),
  };
}

export function getLimit(account: Account, kind: LimitKind): LimitState {
  return account.limits?.[kind] ?? DEFAULT_LIMIT;
}

export function getDisplayLimit(account: Account, kind: LimitKind): LimitState {
  const limit = getLimit(account, kind);
  if (limit.resetsAt && new Date(limit.resetsAt).getTime() < Date.now()) {
    return { ...limit, usagePercent: 0 };
  }
  return limit;
}

export function normalizeExpiredLimit(limit: LimitState | undefined): LimitState | undefined {
  if (!limit) return limit;
  if (limit.resetsAt && new Date(limit.resetsAt).getTime() < Date.now() && limit.usagePercent !== 0) {
    return { ...limit, usagePercent: 0 };
  }
  return limit;
}

export function limitSortTime(limit: LimitState | undefined): number {
  if (!limit?.resetsAt) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(limit.resetsAt).getTime();
  if (!Number.isFinite(timestamp)) return Number.MAX_SAFE_INTEGER;
  if (timestamp < Date.now()) return 0;
  return timestamp;
}

export function getLimitKindsForMode(limitMode: LimitMode): LimitKind[] {
  return limitMode === "dailyWeekly" ? ["daily", "weekly"] : ["general"];
}
