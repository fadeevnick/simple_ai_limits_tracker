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
import { useModal } from "@/lib/useModal";
import { ServiceGroup } from "@/components/ServiceGroup";
import { ServiceModal, ServiceModalData } from "@/components/ServiceModal";
import {
  AccountModal,
  AccountModalData,
  LimitModalData,
} from "@/components/AccountModal";
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
  general: EMPTY_LIMIT,
  daily: EMPTY_LIMIT,
  weekly: EMPTY_LIMIT,
};

const SERVICE_DEFAULTS: ServiceModalData = {
  name: "",
  limitMode: "single",
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

  const addService = async (data: ServiceModalData) => {
    await api.services.create(data.name, data.limitMode);
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

    if (accountModal.modal.open && accountModal.modal.id) {
      await api.accounts.update(accountModal.modal.id, {
        email: data.email,
        password: data.password,
        status: data.status,
        tags: data.tags,
        limits,
      });
    } else {
      await api.accounts.create({
        serviceId: pendingServiceId.current!,
        email: data.email,
        password: data.password || undefined,
        status: data.status,
        tags: data.tags,
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
      <div className="text-lg text-gray-500 text-center py-24">Loading...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 pt-7 pb-10">
      <h1 className="text-4xl font-bold mb-6">Limits</h1>

      {/* Tabs + primary action */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("ai")}
            className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
              tab === "ai"
                ? "bg-[var(--primary)] text-[var(--primary-text)]"
                : "bg-[var(--tab-inactive)] text-gray-600 hover:bg-[var(--tab-hover)]"
            }`}
          >
            AI Limits
          </button>
          <button
            onClick={() => setTab("life")}
            className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${
              tab === "life"
                ? "bg-[var(--primary)] text-[var(--primary-text)]"
                : "bg-[var(--tab-inactive)] text-gray-600 hover:bg-[var(--tab-hover)]"
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
            <div className="text-lg text-center py-24 text-gray-400">
              <p>No services yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
