import { Store, Service, Account, LifeLimit } from "./types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "..", "data");
const STORE_PATH = join(DATA_DIR, "store.json");

function getDefaultStore(): Store {
  return { services: [], accounts: [], lifeLimits: [] };
}

export function readStore(): Store {
  if (!existsSync(STORE_PATH)) {
    writeStore(getDefaultStore());
    return getDefaultStore();
  }
  const raw = readFileSync(STORE_PATH, "utf-8");
  const data = JSON.parse(raw);
  // Migration: ensure lifeLimits exists
  if (!data.lifeLimits) data.lifeLimits = [];
  // Migration: ensure services have order field
  if (data.services) {
    data.services.forEach((s: Service, i: number) => {
      if (s.order === undefined || s.order === null) s.order = i;
    });
  }
  return data as Store;
}

export function writeStore(store: Store): void {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function addService(name: string): Service {
  const store = readStore();
  const maxOrder = store.services.length > 0 ? Math.max(...store.services.map((s) => s.order ?? 0)) : -1;
  const service: Service = { id: crypto.randomUUID(), name, order: maxOrder + 1 };
  store.services.push(service);
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
  const sorted = [...store.services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

export function addAccount(
  serviceId: string,
  name: string,
  usagePercent: number,
  resetsAt?: string
): Account | null {
  const store = readStore();
  if (!store.services.find((s) => s.id === serviceId)) return null;
  const account: Account = {
    id: crypto.randomUUID(),
    serviceId,
    name,
    usagePercent,
    resetsAt,
  };
  store.accounts.push(account);
  writeStore(store);
  return account;
}

export function updateAccount(
  id: string,
  updates: Partial<Pick<Account, "name" | "usagePercent" | "resetsAt">>
): Account | null {
  const store = readStore();
  const account = store.accounts.find((a) => a.id === id);
  if (!account) return null;
  if (updates.name !== undefined) account.name = updates.name;
  if (updates.usagePercent !== undefined) account.usagePercent = updates.usagePercent;
  if (updates.resetsAt !== undefined) account.resetsAt = updates.resetsAt;
  writeStore(store);
  return account;
}

export function deleteAccount(id: string): boolean {
  const store = readStore();
  const len = store.accounts.length;
  store.accounts = store.accounts.filter((a) => a.id !== id);
  if (store.accounts.length === len) return false;
  writeStore(store);
  return true;
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
  updates: Partial<Pick<LifeLimit, "name" | "deadline">>
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
