import type {
  Account,
  AccountLimits,
  LifeLimit,
  LimitMode,
  Service,
} from "./types";

const json = (method: string, body?: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" } as const,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export const api = {
  services: {
    list: (): Promise<Service[]> =>
      fetch("/api/services").then((r) => r.json()),
    create: (name: string, limitMode: LimitMode): Promise<Service> =>
      fetch("/api/services", json("POST", { name, limitMode })).then((r) =>
        r.json(),
      ),
    reorder: (id: string): Promise<Service | null> =>
      fetch(`/api/services/${id}`, json("PATCH", { direction: "up" })).then(
        (r) => r.json(),
      ),
    setActive: (
      id: string,
      activeAccountId: string | null,
    ): Promise<Service | null> =>
      fetch(`/api/services/${id}`, json("PATCH", { activeAccountId })).then(
        (r) => r.json(),
      ),
    delete: (id: string): Promise<{ ok: boolean }> =>
      fetch(`/api/services/${id}`, { method: "DELETE" }).then((r) => r.json()),
  },
  accounts: {
    list: (): Promise<Account[]> =>
      fetch("/api/accounts").then((r) => r.json()),
    create: (data: {
      serviceId: string;
      name: string;
      usagePercent?: number;
      resetsAt?: string;
      limits?: AccountLimits;
    }): Promise<Account> =>
      fetch("/api/accounts", json("POST", data)).then((r) => r.json()),
    update: (
      id: string,
      data: {
        name?: string;
        usagePercent?: number;
        resetsAt?: string;
        limits?: AccountLimits;
      },
    ): Promise<Account> =>
      fetch(`/api/accounts/${id}`, json("PATCH", data)).then((r) => r.json()),
    delete: (id: string): Promise<{ ok: boolean }> =>
      fetch(`/api/accounts/${id}`, { method: "DELETE" }).then((r) => r.json()),
  },
  lifeLimits: {
    list: (): Promise<LifeLimit[]> =>
      fetch("/api/life-limits").then((r) => r.json()),
    create: (name: string, deadline: string): Promise<LifeLimit> =>
      fetch("/api/life-limits", json("POST", { name, deadline })).then((r) =>
        r.json(),
      ),
    update: (
      id: string,
      data: { name?: string; deadline?: string },
    ): Promise<LifeLimit> =>
      fetch(`/api/life-limits/${id}`, json("PATCH", data)).then((r) =>
        r.json(),
      ),
    delete: (id: string): Promise<{ ok: boolean }> =>
      fetch(`/api/life-limits/${id}`, { method: "DELETE" }).then((r) =>
        r.json(),
      ),
  },
};
