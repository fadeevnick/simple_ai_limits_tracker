import {
  Account,
  AccountLimits,
  AccountStatus,
  LimitMode,
  LimitState,
  Service,
  Store,
  LifeLimit,
} from "./types";
import { createLimit, normalizeExpiredLimit } from "./limits";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "..", "data");
const STORE_PATH = join(DATA_DIR, "store.json");

// Add service ids here when an existing service must be migrated from single to daily+weekly.
// During that migration, legacy usagePercent/resetsAt becomes limits.daily.
const DAILY_WEEKLY_SERVICE_IDS = new Set<string>([
  "2dc523f1-7f54-4e66-a691-9ef4c3b81a7b", // claude
  "1280f813-6c7f-44d0-9c83-3d9a003a8106", // devin.ai
]);

function getDefaultStore(): Store {
  return { services: [], accounts: [], lifeLimits: [] };
}

function isLimitMode(value: unknown): value is LimitMode {
  return value === "single" || value === "dailyWeekly";
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return (
    value === "ACTIVE" ||
    value === "BLOCKED" ||
    value === "NOT_ELEGIBLE_FOR_FREE"
  );
}

function hasLimit(limit: LimitState | undefined): limit is LimitState {
  return !!limit && typeof limit.usagePercent === "number";
}

function normalizeLimits(limits: AccountLimits): AccountLimits {
  return {
    ...limits,
    general: normalizeExpiredLimit(limits.general),
    daily: normalizeExpiredLimit(limits.daily),
    weekly: normalizeExpiredLimit(limits.weekly),
  };
}

function migrateStore(data: Partial<Store>): Store {
  const store: Store = {
    services: Array.isArray(data.services) ? data.services : [],
    accounts: Array.isArray(data.accounts) ? data.accounts : [],
    lifeLimits: Array.isArray(data.lifeLimits) ? data.lifeLimits : [],
  };

  store.services.forEach((service, index) => {
    if (service.order === undefined || service.order === null)
      service.order = index;
    if (DAILY_WEEKLY_SERVICE_IDS.has(service.id)) {
      service.limitMode = "dailyWeekly";
    } else if (!isLimitMode(service.limitMode)) {
      service.limitMode = "single";
    }
    if (typeof service.description !== "string") service.description = "";
  });

  const servicesById = new Map(
    store.services.map((service) => [service.id, service]),
  );

  store.accounts.forEach((account) => {
    if (!account.email && account.name) {
      account.email = account.name;
    }
    if (account.email === undefined) account.email = "";
    if (account.name !== undefined) delete account.name;
    if (!isAccountStatus(account.status)) account.status = "ACTIVE";
    account.tags = Array.isArray(account.tags)
      ? account.tags.filter((t): t is string => typeof t === "string")
      : [];

    const service = servicesById.get(account.serviceId);
    const mode = service?.limitMode ?? "single";
    const existingLimits = account.limits ?? {};
    const legacyLimit = createLimit(
      account.usagePercent ?? 0,
      account.resetsAt,
    );

    if (mode === "dailyWeekly") {
      const dailySource =
        existingLimits.daily ?? existingLimits.general ?? legacyLimit;
      account.limits = normalizeLimits({
        ...existingLimits,
        daily: hasLimit(dailySource) ? dailySource : legacyLimit,
        weekly: hasLimit(existingLimits.weekly)
          ? existingLimits.weekly
          : createLimit(0),
      });
    } else {
      const generalSource = existingLimits.general ?? legacyLimit;
      account.limits = normalizeLimits({
        ...existingLimits,
        general: hasLimit(generalSource) ? generalSource : legacyLimit,
      });
    }
  });

  return store;
}

export function readStore(): Store {
  if (!existsSync(STORE_PATH)) {
    const defaultStore = getDefaultStore();
    writeStore(defaultStore);
    return defaultStore;
  }
  const raw = readFileSync(STORE_PATH, "utf-8");
  const data = JSON.parse(raw) as Partial<Store>;
  const store = migrateStore(data);
  writeStore(store);
  return store;
}

export function writeStore(store: Store): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function addService(
  name: string,
  limitMode: LimitMode = "single",
  lifetimeEndsAt?: string,
  description?: string,
): Service {
  const store = readStore();
  const maxOrder =
    store.services.length > 0
      ? Math.max(...store.services.map((s) => s.order ?? 0))
      : -1;
  const service: Service = {
    id: crypto.randomUUID(),
    name,
    order: maxOrder + 1,
    limitMode: isLimitMode(limitMode) ? limitMode : "single",
    description: typeof description === "string" ? description : "",
    ...(lifetimeEndsAt ? { lifetimeEndsAt } : {}),
  };
  store.services.push(service);
  writeStore(store);
  return service;
}

export function updateService(
  id: string,
  updates: Partial<Pick<Service, "name" | "lifetimeEndsAt" | "description">>,
): Service | null {
  const store = readStore();
  const service = store.services.find((s) => s.id === id);
  if (!service) return null;
  if (updates.name !== undefined) service.name = updates.name;
  if (updates.description !== undefined) service.description = updates.description;
  if (updates.lifetimeEndsAt !== undefined) {
    if (updates.lifetimeEndsAt === "" || updates.lifetimeEndsAt === null) {
      delete service.lifetimeEndsAt;
    } else {
      service.lifetimeEndsAt = updates.lifetimeEndsAt;
    }
  }
  writeStore(store);
  return service;
}

export function deleteService(id: string): boolean {
  const store = readStore();
  const len = store.services.length;
  store.services = store.services.filter((s) => s.id !== id);
  store.accounts = store.accounts.filter((a) => a.serviceId !== id);
  if (store.services.length === len) return false;
  writeStore(store);
  return true;
}

export function reorderService(id: string): Service | null {
  const store = readStore();
  const sorted = [...store.services].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const idx = sorted.findIndex((s) => s.id === id);
  if (idx <= 0) return sorted[idx] ?? null;
  const service = store.services.find((s) => s.id === id)!;
  const above = store.services.find((s) => s.id === sorted[idx - 1].id)!;
  const tmpOrder = service.order;
  service.order = above.order;
  above.order = tmpOrder;
  writeStore(store);
  return service;
}

export interface AddAccountInput {
  serviceId: string;
  email: string;
  password?: string;
  status?: AccountStatus;
  tags?: string[];
  lifetimeEndsAt?: string;
  usagePercent?: number;
  resetsAt?: string;
  limits?: AccountLimits;
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function addAccount(input: AddAccountInput): Account | null {
  const {
    serviceId,
    email,
    password,
    status,
    tags,
    lifetimeEndsAt,
    usagePercent = 0,
    resetsAt,
    limits,
  } = input;
  const store = readStore();
  const service = store.services.find((s) => s.id === serviceId);
  if (!service) return null;

  const legacyLimit = createLimit(usagePercent, resetsAt);
  const accountLimits: AccountLimits =
    service.limitMode === "dailyWeekly"
      ? {
          daily: limits?.daily ?? legacyLimit,
          weekly: limits?.weekly ?? createLimit(0),
        }
      : {
          general: limits?.general ?? legacyLimit,
        };

  const account: Account = {
    id: crypto.randomUUID(),
    serviceId,
    email,
    status: isAccountStatus(status) ? status : "ACTIVE",
    tags: normalizeTags(tags),
    limits: normalizeLimits(accountLimits),
    ...(password ? { password } : {}),
    ...(lifetimeEndsAt ? { lifetimeEndsAt } : {}),
  };
  store.accounts.push(account);
  writeStore(store);
  return account;
}

export function updateAccount(
  id: string,
  updates: Partial<
    Pick<
      Account,
      | "email"
      | "password"
      | "status"
      | "tags"
      | "lifetimeEndsAt"
      | "usagePercent"
      | "resetsAt"
      | "limits"
    >
  >,
): Account | null {
  const store = readStore();
  const account = store.accounts.find((a) => a.id === id);
  if (!account) return null;
  if (updates.email !== undefined) account.email = updates.email;
  if (updates.password !== undefined) {
    if (updates.password === "") delete account.password;
    else account.password = updates.password;
  }
  if (updates.status !== undefined && isAccountStatus(updates.status)) {
    account.status = updates.status;
  }
  if (updates.tags !== undefined) account.tags = normalizeTags(updates.tags);
  if (updates.lifetimeEndsAt !== undefined) {
    if (updates.lifetimeEndsAt === "" || updates.lifetimeEndsAt === null) {
      delete account.lifetimeEndsAt;
    } else {
      account.lifetimeEndsAt = updates.lifetimeEndsAt;
    }
  }
  if (updates.usagePercent !== undefined)
    account.usagePercent = updates.usagePercent;
  if (updates.resetsAt !== undefined) account.resetsAt = updates.resetsAt;
  if (updates.limits !== undefined) {
    account.limits = normalizeLimits({ ...account.limits, ...updates.limits });
  }
  writeStore(store);
  return account;
}

export function deleteAccount(id: string): boolean {
  const store = readStore();
  const len = store.accounts.length;
  const account = store.accounts.find((a) => a.id === id);
  store.accounts = store.accounts.filter((a) => a.id !== id);
  if (store.accounts.length === len) return false;
  // Clear activeAccountId on the service if this account was active
  if (account) {
    const service = store.services.find((s) => s.id === account.serviceId);
    if (service && service.activeAccountId === id) {
      service.activeAccountId = undefined;
    }
  }
  writeStore(store);
  return true;
}

export function setActiveAccount(
  serviceId: string,
  accountId: string | null,
): Service | null {
  const store = readStore();
  const service = store.services.find((s) => s.id === serviceId);
  if (!service) return null;
  service.activeAccountId = accountId ?? undefined;
  writeStore(store);
  return service;
}

export function addLifeLimit(name: string, deadline: string): LifeLimit {
  const store = readStore();
  const limit: LifeLimit = { id: crypto.randomUUID(), name, deadline };
  store.lifeLimits.push(limit);
  writeStore(store);
  return limit;
}

export function updateLifeLimit(
  id: string,
  updates: Partial<Pick<LifeLimit, "name" | "deadline">>,
): LifeLimit | null {
  const store = readStore();
  const limit = store.lifeLimits.find((l) => l.id === id);
  if (!limit) return null;
  if (updates.name !== undefined) limit.name = updates.name;
  if (updates.deadline !== undefined) limit.deadline = updates.deadline;
  writeStore(store);
  return limit;
}

export function deleteLifeLimit(id: string): boolean {
  const store = readStore();
  const len = store.lifeLimits.length;
  store.lifeLimits = store.lifeLimits.filter((l) => l.id !== id);
  if (store.lifeLimits.length === len) return false;
  writeStore(store);
  return true;
}
