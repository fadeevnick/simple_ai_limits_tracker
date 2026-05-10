"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Account,
  AccountLimits,
  LimitMode,
  LimitState,
  Service,
} from "@/lib/types";
import { api } from "@/lib/api";
import { getRemainingDHM, calcResetsAt, toDatetimeLocal } from "@/lib/time";
import { getDisplayLimit } from "@/lib/limits";
import { lifetimeDataToIso } from "@/components/ui/LifetimeFields";
import { useModal } from "@/lib/useModal";
import { ServiceGroup } from "@/components/ServiceGroup";
import {
  ServiceModal,
  ServiceModalData,
  ServiceModalSubmit,
} from "@/components/ServiceModal";
import {
  AccountModal,
  AccountModalData,
  LimitModalData,
} from "@/components/AccountModal";
import { buildLifetimeData } from "@/components/ui/LifetimeFields";
import { LifeLimitsTab } from "@/components/LifeLimitsTab";
import { Button } from "@/components/ui/Button";

type Tab = "ai" | "life";

const EMPTY_LIMIT: LimitModalData = {
  usagePercent: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  resetDate: "",
  resetMode: "duration",
};

const ACCOUNT_DEFAULTS: AccountModalData = {
  email: "",
  password: "",
  status: "ACTIVE",
  tags: [],
  lifetime: { mode: "none", days: 0, date: "" },
  general: EMPTY_LIMIT,
  daily: EMPTY_LIMIT,
  weekly: EMPTY_LIMIT,
};

const SERVICE_DEFAULTS: ServiceModalData = {
  name: "",
  limitMode: "single",
  lifetime: { mode: "none", days: 0, date: "" },
  description: "",
};

function limitToModalData(limit?: LimitState): LimitModalData {
  const displayLimit = limit ? { ...limit } : { usagePercent: 0 };
  const rem = getRemainingDHM(displayLimit.resetsAt);
  const resetDate = displayLimit.resetsAt
    ? toDatetimeLocal(displayLimit.resetsAt)
    : "";
  return {
    usagePercent: displayLimit.usagePercent,
    days: rem.days,
    hours: rem.hours,
    minutes: rem.minutes,
    resetDate,
    resetMode: "duration",
  };
}

function modalDataToLimit(data: LimitModalData): LimitState {
  let resetsAt: string | undefined;
  if (data.resetMode === "date" && data.resetDate) {
    resetsAt = new Date(data.resetDate).toISOString();
  } else if (data.days > 0 || data.hours > 0 || data.minutes > 0) {
    resetsAt = calcResetsAt(data.days, data.hours, data.minutes);
  }
  return { usagePercent: data.usagePercent, ...(resetsAt ? { resetsAt } : {}) };
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("ai");
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountLimitMode, setAccountLimitMode] = useState<LimitMode>("single");

  const serviceModal = useModal<ServiceModalData>(SERVICE_DEFAULTS);
  const accountModal = useModal<AccountModalData>(ACCOUNT_DEFAULTS);
  const pendingServiceId = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    const [s, a] = await Promise.all([
      api.services.list(),
      api.accounts.list(),
    ]);
    setServices(s);
    setAccounts(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ─── Service actions ─── */

  const addService = async (data: ServiceModalSubmit) => {
    await api.services.create(
      data.name,
      data.limitMode,
      data.lifetimeEndsAt ?? undefined,
      data.description,
    );
    fetchData();
  };

  const deleteService = async (id: string) => {
    await api.services.delete(id);
    fetchData();
  };

  const moveServiceUp = async (id: string) => {
    await api.services.reorder(id);
    fetchData();
  };

  /* ─── Account actions ─── */

  const openAddAccount = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setAccountLimitMode(service?.limitMode ?? "single");
    accountModal.open({ ...ACCOUNT_DEFAULTS }, null);
    pendingServiceId.current = serviceId;
  };

  const openEditAccount = (account: Account) => {
    const service = services.find((s) => s.id === account.serviceId);
    const limitMode = service?.limitMode ?? "single";
    setAccountLimitMode(limitMode);
    accountModal.open(
      {
        email: account.email,
        password: account.password ?? "",
        status: account.status,
        tags: account.tags ?? [],
        lifetime: buildLifetimeData(account.lifetimeEndsAt),
        general: limitToModalData(getDisplayLimit(account, "general")),
        daily: limitToModalData(getDisplayLimit(account, "daily")),
        weekly: limitToModalData(getDisplayLimit(account, "weekly")),
      },
      account.id,
    );
  };

  const submitAccount = async (data: AccountModalData) => {
    const limits: AccountLimits =
      accountLimitMode === "dailyWeekly"
        ? {
            daily: modalDataToLimit(data.daily),
            weekly: modalDataToLimit(data.weekly),
          }
        : {
            general: modalDataToLimit(data.general),
          };

    const lifetimeIso = lifetimeDataToIso(data.lifetime);
    if (accountModal.modal.open && accountModal.modal.id) {
      await api.accounts.update(accountModal.modal.id, {
        email: data.email,
        password: data.password,
        status: data.status,
        tags: data.tags,
        lifetimeEndsAt: lifetimeIso,
        limits,
      });
    } else {
      await api.accounts.create({
        serviceId: pendingServiceId.current!,
        email: data.email,
        password: data.password || undefined,
        status: data.status,
        tags: data.tags,
        lifetimeEndsAt: lifetimeIso ?? undefined,
        limits,
      });
    }
    accountModal.close();
    fetchData();
  };

  const deleteAccount = async (id: string) => {
    await api.accounts.delete(id);
    accountModal.close();
    fetchData();
  };

  const toggleActiveAccount = async (serviceId: string, accountId: string) => {
    const service = services.find((s) => s.id === serviceId);
    const newActiveId =
      service?.activeAccountId === accountId ? null : accountId;
    await api.services.setActive(serviceId, newActiveId);
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, activeAccountId: newActiveId ?? undefined }
          : s,
      ),
    );
  };

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="text-sm text-[var(--text-muted)] text-center py-24">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-10 pb-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-bright)]">
          Limits
        </h1>
        <p className="text-base text-[var(--text-muted)] mt-1.5">
          Track AI service usage and life deadlines.
        </p>
      </header>

      {/* Tabs + primary action */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="inline-flex p-1 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)]">
          <button
            onClick={() => setTab("ai")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "ai"
                ? "bg-[var(--surface)] text-[var(--text-bright)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-bright)]"
            }`}
          >
            AI Limits
          </button>
          <button
            onClick={() => setTab("life")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "life"
                ? "bg-[var(--surface)] text-[var(--text-bright)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-bright)]"
            }`}
          >
            Life Limits
          </button>
        </div>
        {tab === "ai" && (
          <Button variant="primary" onClick={() => serviceModal.open()}>
            + Service
          </Button>
        )}
      </div>

      {/* Tab content */}
      {tab === "ai" ? (
        <>
          {services.length === 0 ? (
            <div className="text-sm text-center py-24 text-[var(--text-faint)]">
              <p>No services yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...services]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((service, idx) => (
                  <ServiceGroup
                    key={service.id}
                    service={service}
                    accounts={accounts.filter(
                      (a) => a.serviceId === service.id,
                    )}
                    isFirst={idx === 0}
                    onToggleActive={(id) => toggleActiveAccount(service.id, id)}
                    onAddAccount={openAddAccount}
                    onEditAccount={openEditAccount}
                    onDeleteAccount={deleteAccount}
                    onMoveUp={moveServiceUp}
                    onDeleteService={deleteService}
                  />
                ))}
            </div>
          )}
        </>
      ) : (
        <LifeLimitsTab />
      )}

      <ServiceModal
        open={serviceModal.isOpen}
        initial={
          serviceModal.modal.open
            ? serviceModal.modal.initial
            : SERVICE_DEFAULTS
        }
        onSubmit={(data) => {
          serviceModal.close();
          addService(data);
        }}
        onClose={serviceModal.close}
      />

      <AccountModal
        open={accountModal.isOpen}
        title={
          accountModal.modal.open && accountModal.modal.id
            ? "Edit account"
            : "Add account"
        }
        limitMode={accountLimitMode}
        initial={
          accountModal.modal.open
            ? accountModal.modal.initial
            : ACCOUNT_DEFAULTS
        }
        onSubmit={submitAccount}
        onClose={accountModal.close}
        showDelete={accountModal.modal.open ? !!accountModal.modal.id : false}
        onDelete={(() => {
          if (!accountModal.modal.open) return undefined;
          const id = accountModal.modal.id;
          return id ? () => deleteAccount(id) : undefined;
        })()}
      />
    </div>
  );
}
