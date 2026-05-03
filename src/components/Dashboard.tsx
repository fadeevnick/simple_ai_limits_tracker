"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Service, Account } from "@/lib/types";

function formatTimeLeft(resetsAt: string): string {
  const diff = new Date(resetsAt).getTime() - Date.now();
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

function getRemainingHM(resetsAt?: string): { hours: number; minutes: number } {
  if (!resetsAt || isExpired(resetsAt)) return { hours: 0, minutes: 0 };
  const diff = new Date(resetsAt).getTime() - Date.now();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

/* ─── Modal ─── */

interface AccountModalProps {
  open: boolean;
  title: string;
  initial: { name: string; usagePercent: number; hours: number; minutes: number };
  onSubmit: (data: { name: string; usagePercent: number; hours: number; minutes: number }) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

function AccountModal({ open, title, initial, onSubmit, onClose, showDelete, onDelete }: AccountModalProps) {
  const [name, setName] = useState(initial.name);
  const [percent, setPercent] = useState(initial.usagePercent);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setPercent(initial.usagePercent);
      setHours(initial.hours);
      setMinutes(initial.minutes);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), usagePercent: percent, hours, minutes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Account name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Usage percent (0-100)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-100 text-center focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Resets in</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-xs text-gray-500">h</span>
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-xs text-gray-500">m</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {showDelete && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(); onClose(); }}
                className="text-xs text-red-400 hover:text-red-300 mr-auto"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Service name modal ─── */

interface ServiceModalProps {
  open: boolean;
  initial: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

function ServiceModal({ open, initial, onSubmit, onClose }: ServiceModalProps) {
  const [name, setName] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4">New service</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit(name.trim());
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-400 mb-1">Service name</label>
            <input
              ref={ref}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── AccountRow ─── */

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function AccountRow({ account, onEdit, onDelete }: AccountRowProps) {
  const expired = isExpired(account.resetsAt);
  const displayPercent = expired ? 0 : account.usagePercent;
  const isAvailable = displayPercent === 0;

  const timeLabel = account.resetsAt && !isExpired(account.resetsAt)
    ? formatTimeLeft(account.resetsAt)
    : isAvailable
    ? "Available"
    : "—";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/50 group">
      <span className="text-sm text-gray-300 w-32 truncate">{account.name}</span>
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(displayPercent)}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <span className={`text-sm font-mono w-14 text-right ${getTextColor(displayPercent)}`}>
        {displayPercent}%
      </span>
      <span className={`text-sm font-mono w-28 text-right ${isAvailable ? "text-emerald-400" : "text-gray-300"}`}>
        {timeLabel}
      </span>
      <button
        onClick={() => onEdit(account)}
        className="text-gray-600 hover:text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        edit
      </button>
      <button
        onClick={() => onDelete(account.id)}
        className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        del
      </button>
    </div>
  );
}

/* ─── ServiceGroup ─── */

interface ServiceGroupProps {
  service: Service;
  accounts: Account[];
  onAddAccount: (serviceId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onDeleteService: (id: string) => void;
}

function ServiceGroup({
  service,
  accounts,
  onAddAccount,
  onEditAccount,
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
            onClick={() => onDeleteService(service.id)}
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
              onEdit={onEditAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard ─── */

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Edit account");
  const [modalAccountId, setModalAccountId] = useState<string | null>(null);
  const [modalServiceId, setModalServiceId] = useState<string | null>(null);
  const [modalInitial, setModalInitial] = useState({ name: "", usagePercent: 0, hours: 0, minutes: 0 });
  const [modalShowDelete, setModalShowDelete] = useState(false);

  const fetchData = useCallback(async () => {
    const [sRes, aRes] = await Promise.all([
      fetch("/api/services"),
      fetch("/api/accounts"),
    ]);
    setServices(await sRes.json());
    setAccounts(await aRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Service actions
  const addService = async (name: string) => {
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchData();
  };

  const deleteService = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetchData();
  };

  // Account actions
  const openAddAccount = (serviceId: string) => {
    setModalTitle("Add account");
    setModalAccountId(null);
    setModalServiceId(serviceId);
    setModalInitial({ name: "", usagePercent: 0, hours: 0, minutes: 0 });
    setModalShowDelete(false);
    setAccountModalOpen(true);
  };

  const openEditAccount = (account: Account) => {
    const rem = getRemainingHM(account.resetsAt);
    setModalTitle("Edit account");
    setModalAccountId(account.id);
    setModalServiceId(account.serviceId);
    setModalInitial({
      name: account.name,
      usagePercent: isExpired(account.resetsAt) ? 0 : account.usagePercent,
      hours: rem.hours,
      minutes: rem.minutes,
    });
    setModalShowDelete(true);
    setAccountModalOpen(true);
  };

  const submitAccount = async (data: { name: string; usagePercent: number; hours: number; minutes: number }) => {
    const resetsAt = data.hours > 0 || data.minutes > 0 ? calcResetsAt(data.hours, data.minutes) : undefined;

    if (modalAccountId) {
      // edit
      await fetch(`/api/accounts/${modalAccountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, usagePercent: data.usagePercent, resetsAt }),
      });
    } else if (modalServiceId) {
      // add
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: modalServiceId,
          name: data.name,
          usagePercent: data.usagePercent,
          resetsAt,
        }),
      });
    }
    setAccountModalOpen(false);
    fetchData();
  };

  const deleteAccount = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setAccountModalOpen(false);
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
          onClick={() => setServiceModalOpen(true)}
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
              onAddAccount={openAddAccount}
              onEditAccount={openEditAccount}
              onDeleteAccount={deleteAccount}
              onDeleteService={deleteService}
            />
          ))}
        </div>
      )}

      <ServiceModal
        open={serviceModalOpen}
        initial=""
        onSubmit={(name) => { setServiceModalOpen(false); addService(name); }}
        onClose={() => setServiceModalOpen(false)}
      />

      <AccountModal
        open={accountModalOpen}
        title={modalTitle}
        initial={modalInitial}
        onSubmit={submitAccount}
        onClose={() => setAccountModalOpen(false)}
        showDelete={modalShowDelete}
        onDelete={modalAccountId ? () => deleteAccount(modalAccountId) : undefined}
      />
    </div>
  );
}
