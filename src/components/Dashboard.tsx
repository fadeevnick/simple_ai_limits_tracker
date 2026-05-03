"use client";

import { useState, useEffect } from "react";
import { Service, Account } from "@/lib/types";

function formatTimeLeft(resetsAt: string): string {
  const now = Date.now();
  const reset = new Date(resetsAt).getTime();
  const diff = reset - now;
  if (diff <= 0) return "Ready to reset";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getBarColor(percent: number): string {
  if (percent <= 50) return "bg-emerald-500";
  if (percent <= 80) return "bg-yellow-500";
  return "bg-red-500";
}

function getTextColor(percent: number): string {
  if (percent <= 50) return "text-emerald-400";
  if (percent <= 80) return "text-yellow-400";
  return "text-red-400";
}

function calcResetsAt(hours: number, minutes: number): string {
  return new Date(Date.now() + hours * 3600000 + minutes * 60000).toISOString();
}

function isExpired(resetsAt?: string): boolean {
  if (!resetsAt) return false;
  return new Date(resetsAt).getTime() < Date.now();
}

interface AccountRowProps {
  account: Account;
  onUpdate: (id: string, updates: Partial<Pick<Account, "name" | "usagePercent" | "resetsAt">>) => void;
  onDelete: (id: string) => void;
}

function AccountRow({ account, onUpdate, onDelete }: AccountRowProps) {
  const expired = isExpired(account.resetsAt);
  const displayPercent = expired ? 0 : account.usagePercent;
  const isAvailable = displayPercent === 0;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/50 group">
      <span className="text-sm text-gray-300 w-32 truncate">{account.name}</span>
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(displayPercent)}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-12 text-right ${getTextColor(displayPercent)}`}>
        {displayPercent}%
      </span>
      <span className="text-xs text-gray-500 w-24 text-right">
        {isAvailable
          ? "Available"
          : account.resetsAt
          ? formatTimeLeft(account.resetsAt)
          : "—"}
      </span>
      <button
        onClick={() => {
          const percent = prompt("Usage percent (0-100):", String(account.usagePercent));
          if (percent === null) return;
          const hours = prompt("Resets in — hours:", "0");
          if (hours === null) return;
          const minutes = prompt("Resets in — minutes:", "0");
          if (minutes === null) return;
          const h = Number(hours) || 0;
          const m = Number(minutes) || 0;
          onUpdate(account.id, {
            usagePercent: Number(percent),
            resetsAt: h > 0 || m > 0 ? calcResetsAt(h, m) : undefined,
          });
        }}
        className="text-gray-600 hover:text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        edit
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete "${account.name}"?`)) onDelete(account.id);
        }}
        className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        del
      </button>
    </div>
  );
}

interface ServiceGroupProps {
  service: Service;
  accounts: Account[];
  onAddAccount: (serviceId: string) => void;
  onUpdateAccount: (id: string, updates: Partial<Pick<Account, "name" | "usagePercent" | "resetsAt">>) => void;
  onDeleteAccount: (id: string) => void;
  onDeleteService: (id: string) => void;
}

function ServiceGroup({
  service,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onDeleteService,
}: ServiceGroupProps) {
  const sorted = [...accounts].sort((a, b) => {
    const aExpired = isExpired(a.resetsAt);
    const bExpired = isExpired(b.resetsAt);
    const aAvail = aExpired ? 0 : a.usagePercent === 0 ? 0 : 1;
    const bAvail = bExpired ? 0 : b.usagePercent === 0 ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    if (a.resetsAt && b.resetsAt) return new Date(a.resetsAt).getTime() - new Date(b.resetsAt).getTime();
    if (a.resetsAt) return -1;
    if (b.resetsAt) return 1;
    return a.usagePercent - b.usagePercent;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">{service.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onAddAccount(service.id)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded"
          >
            + account
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete service "${service.name}" and all its accounts?`))
                onDeleteService(service.id);
            }}
            className="text-xs text-gray-600 hover:text-red-400 px-1"
          >
            delete
          </button>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">No accounts yet</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              onUpdate={onUpdateAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [sRes, aRes] = await Promise.all([
      fetch("/api/services"),
      fetch("/api/accounts"),
    ]);
    setServices(await sRes.json());
    setAccounts(await aRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const addService = async () => {
    const name = prompt("Service name:");
    if (!name) return;
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchData();
  };

  const addAccount = async (serviceId: string) => {
    const name = prompt("Account name:");
    if (!name) return;
    const percent = prompt("Usage percent (0-100):", "0");
    if (percent === null) return;
    const hours = prompt("Resets in — hours:", "0");
    if (hours === null) return;
    const minutes = prompt("Resets in — minutes:", "0");
    if (minutes === null) return;
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        name,
        usagePercent: Number(percent),
        resetsAt: h > 0 || m > 0 ? calcResetsAt(h, m) : undefined,
      }),
    });
    fetchData();
  };

  const updateAccount = async (
    id: string,
    updates: Partial<Pick<Account, "name" | "usagePercent" | "resetsAt">>
  ) => {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchData();
  };

  const deleteAccount = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    fetchData();
  };

  const deleteService = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">AI Limits</h1>
        <button
          onClick={addService}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + Service
        </button>
      </div>
      {services.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p>No services yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceGroup
              key={service.id}
              service={service}
              accounts={accounts.filter((a) => a.serviceId === service.id)}
              onAddAccount={addAccount}
              onUpdateAccount={updateAccount}
              onDeleteAccount={deleteAccount}
              onDeleteService={deleteService}
            />
          ))}
        </div>
      )}
    </div>
  );
}
