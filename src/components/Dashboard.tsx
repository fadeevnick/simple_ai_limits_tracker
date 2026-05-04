"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Service, Account, LifeLimit } from "@/lib/types";

/* ─── Helpers ─── */

function formatTimeLeft(resetsAt: string): string {
  const diff = new Date(resetsAt).getTime() - Date.now();
  if (diff <= 0) return "now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function calcResetsAt(days: number, hours: number, minutes: number): string {
  return new Date(Date.now() + days * 86400000 + hours * 3600000 + minutes * 60000).toISOString();
}

function isExpired(resetsAt?: string): boolean {
  if (!resetsAt) return false;
  return new Date(resetsAt).getTime() < Date.now();
}

function getRemainingDHM(resetsAt?: string): { days: number; hours: number; minutes: number } {
  if (!resetsAt || isExpired(resetsAt)) return { days: 0, hours: 0, minutes: 0 };
  const diff = new Date(resetsAt).getTime() - Date.now();
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

/* ─── Modal shell ─── */

function ModalShell({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── AccountModal ─── */

interface AccountModalProps {
  open: boolean;
  title: string;
  initial: { name: string; usagePercent: number; days: number; hours: number; minutes: number };
  onSubmit: (data: { name: string; usagePercent: number; days: number; hours: number; minutes: number }) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

function AccountModal({ open, title, initial, onSubmit, onClose, showDelete, onDelete }: AccountModalProps) {
  const [name, setName] = useState(initial.name);
  const [percent, setPercent] = useState(initial.usagePercent);
  const [days, setDays] = useState(initial.days);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setPercent(initial.usagePercent);
      setDays(initial.days);
      setHours(initial.hours);
      setMinutes(initial.minutes);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), usagePercent: percent, days, hours, minutes });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">{title}</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Account name</label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Usage — {percent}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Resets in</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
                />
                <span className="text-base text-gray-400">d</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
                />
                <span className="text-base text-gray-400">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
                />
                <span className="text-base text-gray-400">m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-8 py-4">
          {showDelete && onDelete && (
            <button type="button" onClick={() => { onDelete(); onClose(); }} className="px-4 py-2 text-sm border border-red-200 rounded-md text-red-600 hover:bg-red-50 hover:border-red-300">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)]">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-text)] rounded-md hover:bg-[var(--primary-hover)]">
            Save
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── ServiceModal ─── */

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

  return (
    <ModalShell open={open} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
      >
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">New service</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-2">Service name</label>
            <input
              ref={ref}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-8 py-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)]">Cancel</button>
          <button type="submit" className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-text)] rounded-md hover:bg-[var(--primary-hover)]">Add</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── LifeLimitModal ─── */

interface LifeLimitModalProps {
  open: boolean;
  title: string;
  initial: { name: string; deadline: string };
  onSubmit: (data: { name: string; deadline: string }) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

function LifeLimitModal({ open, title, initial, onSubmit, onClose, showDelete, onDelete }: LifeLimitModalProps) {
  const [name, setName] = useState(initial.name);
  const [deadline, setDeadline] = useState(initial.deadline);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setDeadline(initial.deadline);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && deadline) onSubmit({ name: name.trim(), deadline });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">{title}</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Event name</label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--border)] px-8 py-4">
          {showDelete && onDelete && (
            <button type="button" onClick={() => { onDelete(); onClose(); }} className="px-4 py-2 text-sm border border-red-200 rounded-md text-red-600 hover:bg-red-50 hover:border-red-300">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)]">Cancel</button>
          <button type="submit" className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-text)] rounded-md hover:bg-[var(--primary-hover)]">Save</button>
        </div>
      </form>
    </ModalShell>
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
    ? "available"
    : "—";

  return (
    <div className="flex items-center gap-4 py-3">
      <span className="text-base w-40 truncate">{account.name}</span>
      <div className="flex-1 h-2 bg-[var(--tab-inactive)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--fill)]/50 rounded-full transition-all duration-500"
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <span className="text-base font-mono w-16 text-right text-gray-500">
        {displayPercent}%
      </span>
      <span className="text-base font-mono w-32 text-right">
        {timeLabel}
      </span>
      <div className="flex gap-2">
        <button onClick={() => onEdit(account)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)] hover:border-gray-400">edit</button>
        <button onClick={() => onDelete(account.id)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50">del</button>
      </div>
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
    <div className="border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{service.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onAddAccount(service.id)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-gray-500 hover:text-[var(--text-bright)] hover:border-gray-400"
          >
            + Account
          </button>
          <button
            onClick={() => onDeleteService(service.id)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-500 hover:text-red-500 hover:border-red-500/30"
          >
            delete
          </button>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-base text-gray-400 py-2">No accounts yet</p>
      ) : (
        <div>
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

/* ─── LifeLimitRow ─── */

interface LifeLimitRowProps {
  limit: LifeLimit;
  onEdit: (limit: LifeLimit) => void;
  onDelete: (id: string) => void;
}

function LifeLimitRow({ limit, onEdit, onDelete }: LifeLimitRowProps) {
  const overdue = new Date(limit.deadline).getTime() < Date.now();

  return (
    <div className="flex items-center gap-4 py-3">
      <span className="text-base flex-1 truncate">{limit.name}</span>
      <span className={`text-base font-mono w-32 text-right ${overdue ? "text-red-600" : ""}`}>
        {formatDeadline(limit.deadline)}
      </span>
      <span className="text-sm font-mono w-40 text-right text-gray-400">
        {new Date(limit.deadline).toLocaleString("ru-RU", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })}
      </span>
      <div className="flex gap-2">
        <button onClick={() => onEdit(limit)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)] hover:border-gray-400">edit</button>
        <button onClick={() => onDelete(limit.id)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50">del</button>
      </div>
    </div>
  );
}

/* ─── LifeLimitsTab ─── */

function LifeLimitsTab() {
  const [limits, setLimits] = useState<LifeLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add event");
  const [modalLimitId, setModalLimitId] = useState<string | null>(null);
  const [modalInitial, setModalInitial] = useState({ name: "", deadline: "" });

  const fetchLimits = useCallback(async () => {
    const res = await fetch("/api/life-limits");
    setLimits(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLimits();
    const interval = setInterval(fetchLimits, 30000);
    return () => clearInterval(interval);
  }, [fetchLimits]);

  const openAdd = () => {
    setModalTitle("Add event");
    setModalLimitId(null);
    setModalInitial({ name: "", deadline: "" });
    setModalOpen(true);
  };

  const openEdit = (limit: LifeLimit) => {
    setModalTitle("Edit event");
    setModalLimitId(limit.id);
    const dt = new Date(limit.deadline);
    const local = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    setModalInitial({ name: limit.name, deadline: local });
    setModalOpen(true);
  };

  const submitLimit = async (data: { name: string; deadline: string }) => {
    const iso = new Date(data.deadline).toISOString();
    if (modalLimitId) {
      await fetch(`/api/life-limits/${modalLimitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, deadline: iso }),
      });
    } else {
      await fetch("/api/life-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, deadline: iso }),
      });
    }
    setModalOpen(false);
    fetchLimits();
  };

  const deleteLimit = async (id: string) => {
    await fetch(`/api/life-limits/${id}`, { method: "DELETE" });
    setModalOpen(false);
    fetchLimits();
  };

  if (loading) return <div className="text-gray-500 text-center py-24">Loading...</div>;

  const sorted = [...limits].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openAdd}
          className="px-5 py-2.5 text-sm font-medium bg-[var(--primary)] text-[var(--primary-text)] rounded-md hover:bg-[var(--primary-hover)]"
        >
          + Event
        </button>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p>No events yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg p-6">
          {sorted.map((l) => (
            <LifeLimitRow key={l.id} limit={l} onEdit={openEdit} onDelete={deleteLimit} />
          ))}
        </div>
      )}

      <LifeLimitModal
        open={modalOpen}
        title={modalTitle}
        initial={modalInitial}
        onSubmit={submitLimit}
        onClose={() => setModalOpen(false)}
        showDelete={!!modalLimitId}
        onDelete={modalLimitId ? () => deleteLimit(modalLimitId) : undefined}
      />
    </div>
  );
}

/* ─── Dashboard (tabs) ─── */

type Tab = "ai" | "life";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("ai");
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Edit account");
  const [modalAccountId, setModalAccountId] = useState<string | null>(null);
  const [modalServiceId, setModalServiceId] = useState<string | null>(null);
  const [modalInitial, setModalInitial] = useState({ name: "", usagePercent: 0, days: 0, hours: 0, minutes: 0 });
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

  const openAddAccount = (serviceId: string) => {
    setModalTitle("Add account");
    setModalAccountId(null);
    setModalServiceId(serviceId);
    setModalInitial({ name: "", usagePercent: 0, days: 0, hours: 0, minutes: 0 });
    setModalShowDelete(false);
    setAccountModalOpen(true);
  };

  const openEditAccount = (account: Account) => {
    const rem = getRemainingDHM(account.resetsAt);
    setModalTitle("Edit account");
    setModalAccountId(account.id);
    setModalServiceId(account.serviceId);
    setModalInitial({
      name: account.name,
      usagePercent: isExpired(account.resetsAt) ? 0 : account.usagePercent,
      days: rem.days,
      hours: rem.hours,
      minutes: rem.minutes,
    });
    setModalShowDelete(true);
    setAccountModalOpen(true);
  };

  const submitAccount = async (data: { name: string; usagePercent: number; days: number; hours: number; minutes: number }) => {
    const resetsAt = data.days > 0 || data.hours > 0 || data.minutes > 0 ? calcResetsAt(data.days, data.hours, data.minutes) : undefined;

    if (modalAccountId) {
      await fetch(`/api/accounts/${modalAccountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, usagePercent: data.usagePercent, resetsAt }),
      });
    } else if (modalServiceId) {
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
            <button
              onClick={() => setServiceModalOpen(true)}
              className="px-5 py-2.5 text-sm font-medium bg-[var(--primary)] text-[var(--primary-text)] rounded-md hover:bg-[var(--primary-hover)]"
            >
              + Service
            </button>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
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
        </>
      ) : (
        <LifeLimitsTab />
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
