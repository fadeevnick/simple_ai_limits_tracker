import { Store, Service, Account } from "./types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "..", "data");
const STORE_PATH = join(DATA_DIR, "store.json");

function getDefaultStore(): Store {
  return { services: [], accounts: [] };
}

export function readStore(): Store {
  if (!existsSync(STORE_PATH)) {
    writeStore(getDefaultStore());
    return getDefaultStore();
  }
  const raw = readFileSync(STORE_PATH, "utf-8");
  return JSON.parse(raw) as Store;
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
  const service: Service = { id: crypto.randomUUID(), name };
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
