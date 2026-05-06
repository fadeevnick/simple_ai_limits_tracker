"use client";

import { useState, useEffect, useCallback } from "react";
import { Service, Account } from "@/lib/types";
import { api } from "@/lib/api";
import { isExpired, getRemainingDHM, calcResetsAt, toDatetimeLocal } from "@/lib/time";
import { useModal } from "@/lib/useModal";
import { ServiceGroup } from "@/components/ServiceGroup";
import { ServiceModal } from "@/components/ServiceModal";
import { AccountModal, AccountModalData } from "@/components/AccountModal";
import { LifeLimitsTab } from "@/components/LifeLimitsTab";
import { Button } from "@/components/ui/Button";

type Tab = "ai" | "life";

const ACCOUNT_DEFAULTS: AccountModalData = {
  name: "", usagePercent: 0, days: 0, hours: 0, minutes: 0, resetDate: "", resetMode: "duration",
};

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("ai");
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const serviceModal = useModal<string>("");
  const accountModal = useModal<AccountModalData>(ACCOUNT_DEFAULTS);

  const fetchData = useCallback(async () => {
    const [s, a] = await Promise.all([api.services.list(), api.accounts.list()]);
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

  const addService = async (name: string) => {
    await api.services.create(name);
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
    accountModal.open({ ...ACCOUNT_DEFAULTS }, null);
    // store serviceId separately — not part of modal data
    pendingServiceId.current = serviceId;
  };

  const pendingServiceId = { current: null as string | null };

  const openEditAccount = (account: Account) => {
    const rem = getRemainingDHM(account.resetsAt);
    const resetDate = account.resetsAt && !isExpired(account.resetsAt)
      ? toDatetimeLocal(account.resetsAt)
      : "";
    accountModal.open({
      name: account.name,
      usagePercent: isExpired(account.resetsAt) ? 0 : account.usagePercent,
      days: rem.days,
      hours: rem.hours,
      minutes: rem.minutes,
      resetDate,
      resetMode: "duration",
    }, account.id);
  };

  const submitAccount = async (data: AccountModalData) => {
    let resetsAt: string | undefined;
    if (data.resetMode === "date" && data.resetDate) {
      resetsAt = new Date(data.resetDate).toISOString();
    } else if (data.days > 0 || data.hours > 0 || data.minutes > 0) {
      resetsAt = calcResetsAt(data.days, data.hours, data.minutes);
    }

    if (accountModal.modal.open && accountModal.modal.id) {
      await api.accounts.update(accountModal.modal.id, { name: data.name, usagePercent: data.usagePercent, resetsAt });
    } else {
      await api.accounts.create({ serviceId: pendingServiceId.current!, name: data.name, usagePercent: data.usagePercent, resetsAt });
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
    const newActiveId = service?.activeAccountId === accountId ? null : accountId;
    await api.services.setActive(serviceId, newActiveId);
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, activeAccountId: newActiveId ?? undefined } : s
      )
    );
  };

  /* ─── Render ─── */

  if (loading) {
    return <div className="text-gray-500 text-center py-24">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Limits</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("ai")}
          className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
            tab === "ai"
              ? "bg-[var(--primary)] text-[var(--primary-text)]"
              : "bg-[var(--tab-inactive)] text-gray-600 hover:bg-[var(--tab-hover)]"
          }`}
        >
          AI Limits
        </button>
        <button
          onClick={() => setTab("life")}
          className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
            tab === "life"
              ? "bg-[var(--primary)] text-[var(--primary-text)]"
              : "bg-[var(--tab-inactive)] text-gray-600 hover:bg-[var(--tab-hover)]"
          }`}
        >
          Life Limits
        </button>
      </div>

      {/* Tab content */}
      {tab === "ai" ? (
        <>
          <div className="flex justify-end mb-6">
            <Button variant="primary" onClick={() => serviceModal.open()}>+ Service</Button>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p>No services yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((service, idx) => (
                <ServiceGroup
                  key={service.id}
                  service={service}
                  accounts={accounts.filter((a) => a.serviceId === service.id)}
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
        initial={serviceModal.modal.open ? serviceModal.modal.initial : ""}
        onSubmit={(name) => { serviceModal.close(); addService(name); }}
        onClose={serviceModal.close}
      />

      <AccountModal
        open={accountModal.isOpen}
        title={accountModal.modal.open && accountModal.modal.id ? "Edit account" : "Add account"}
        initial={accountModal.modal.open ? accountModal.modal.initial : ACCOUNT_DEFAULTS}
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
