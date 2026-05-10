"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Account,
  AccountLimits,
  LimitMode,
  LimitState,
  Service,
} from "@/lib/types";
import { api } from "@/lib/api";
import {
  formatTimeLeft,
  getRemainingDHM,
  calcResetsAt,
  toDatetimeLocal,
} from "@/lib/time";
import { getDisplayLimit } from "@/lib/limits";
import {
  buildLifetimeData,
  lifetimeDataToIso,
} from "@/components/ui/LifetimeFields";
import { useModal } from "@/lib/useModal";
import { AccountRow } from "@/components/AccountRow";
import {
  AccountModal,
  AccountModalData,
  LimitModalData,
} from "@/components/AccountModal";
import {
  ServiceModal,
  ServiceModalData,
  ServiceModalSubmit,
  buildLifetimeInitial,
} from "@/components/ServiceModal";
import { Button } from "@/components/ui/Button";

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

const SERVICE_MODAL_DEFAULTS = {
  name: "",
  limitMode: "single" as const,
  lifetime: { mode: "none" as const, days: 0, date: "" },
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

function lifetimeBadge(lifetimeEndsAt?: string) {
  if (!lifetimeEndsAt) return null;
  const expired = new Date(lifetimeEndsAt).getTime() < Date.now();
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-base text-gray-500">Lifetime</span>
      <span
        className={`text-lg font-mono ${expired ? "text-red-500" : "text-[var(--text-bright)]"}`}
      >
        {expired ? "expired" : formatTimeLeft(lifetimeEndsAt)}
      </span>
      <span className="text-sm text-gray-400">
        ({new Date(lifetimeEndsAt).toLocaleString()})
      </span>
    </div>
  );
}

export function ServiceDetail({ serviceId }: { serviceId: string }) {
  const [service, setService] = useState<Service | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const accountModal = useModal<AccountModalData>(ACCOUNT_DEFAULTS);
  const serviceModal = useModal<ServiceModalData>(SERVICE_MODAL_DEFAULTS);
  const pendingNewAccount = useRef(false);

  const fetchData = useCallback(async () => {
    const [services, allAccounts] = await Promise.all([
      api.services.list(),
      api.accounts.list(),
    ]);
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setService(svc);
    setAccounts(allAccounts.filter((a) => a.serviceId === serviceId));
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const limitMode: LimitMode = service?.limitMode ?? "single";

  const openAddAccount = () => {
    pendingNewAccount.current = true;
    accountModal.open({ ...ACCOUNT_DEFAULTS }, null);
  };

  const openEditAccount = (account: Account) => {
    pendingNewAccount.current = false;
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
      limitMode === "dailyWeekly"
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
        serviceId,
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

  const toggleActiveAccount = async (accountId: string) => {
    if (!service) return;
    const newActiveId =
      service.activeAccountId === accountId ? null : accountId;
    await api.services.setActive(service.id, newActiveId);
    setService({ ...service, activeAccountId: newActiveId ?? undefined });
  };

  const openEditService = () => {
    if (!service) return;
    serviceModal.open(
      {
        name: service.name,
        limitMode: service.limitMode,
        description: service.description ?? "",
        ...buildLifetimeInitial(service.lifetimeEndsAt),
      },
      service.id,
    );
  };

  const submitServiceEdit = async (data: ServiceModalSubmit) => {
    if (!service) return;
    await api.services.update(service.id, {
      name: data.name,
      lifetimeEndsAt: data.lifetimeEndsAt,
      description: data.description,
    });
    serviceModal.close();
    fetchData();
  };

  if (loading) {
    return (
      <div className="text-lg text-gray-500 text-center py-24">Loading...</div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="max-w-6xl mx-auto px-8 pt-7 pb-10">
        <Link href="/" className="text-base text-gray-500 hover:underline">
          ← Back
        </Link>
        <p className="mt-8 text-xl text-gray-400">Service not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 pt-7 pb-10">
      <Link
        href="/"
        className="inline-block mb-6 text-base text-gray-500 hover:underline"
      >
        ← All services
      </Link>

      <div className="border border-[var(--border)] rounded-xl p-7 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold">{service.name}</h1>
            <p className="text-sm text-gray-400 mt-2">
              {service.limitMode === "dailyWeekly"
                ? "daily + weekly limits"
                : "single limit"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openEditService}>Edit</Button>
            <Button variant="primary" onClick={openAddAccount}>
              + Account
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {lifetimeBadge(service.lifetimeEndsAt) ?? (
            <div className="text-base text-gray-500">
              Lifetime — not set
            </div>
          )}
        </div>

        <div>
          <div className="text-base text-gray-500 mb-1">Description</div>
          {service.description ? (
            <p className="text-base whitespace-pre-wrap text-[var(--text-bright)]">
              {service.description}
            </p>
          ) : (
            <p className="text-base text-gray-400 italic">No description</p>
          )}
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-xl p-7">
        <h2 className="text-2xl font-bold mb-4">
          Accounts{" "}
          <span className="text-base font-normal text-gray-400">
            ({accounts.length})
          </span>
        </h2>
        {accounts.length === 0 ? (
          <p className="text-lg text-gray-400 py-3">No accounts yet</p>
        ) : (
          <div>
            {accounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                limitMode={limitMode}
                isActive={acc.id === service.activeAccountId}
                onToggleActive={toggleActiveAccount}
                onEdit={openEditAccount}
                onDelete={deleteAccount}
              />
            ))}
          </div>
        )}
      </div>

      <AccountModal
        open={accountModal.isOpen}
        title={
          accountModal.modal.open && accountModal.modal.id
            ? "Edit account"
            : "Add account"
        }
        limitMode={limitMode}
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

      <ServiceModal
        open={serviceModal.isOpen}
        title="Edit service"
        submitLabel="Save"
        lockLimitMode
        initial={
          serviceModal.modal.open
            ? serviceModal.modal.initial
            : SERVICE_MODAL_DEFAULTS
        }
        onSubmit={submitServiceEdit}
        onClose={serviceModal.close}
      />
    </div>
  );
}
