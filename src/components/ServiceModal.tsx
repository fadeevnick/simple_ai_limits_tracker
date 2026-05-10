import { useState, useEffect, useRef } from "react";
import type { LimitMode } from "@/lib/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  LifetimeData,
  LifetimeFields,
  buildLifetimeData,
  lifetimeDataToIso,
} from "@/components/ui/LifetimeFields";

export interface ServiceModalData {
  name: string;
  limitMode: LimitMode;
  lifetime: LifetimeData;
  description: string;
}

export interface ServiceModalSubmit {
  name: string;
  limitMode: LimitMode;
  lifetimeEndsAt: string | null; // ISO string, or null to clear
  description: string;
}

interface ServiceModalProps {
  open: boolean;
  initial: ServiceModalData;
  title?: string;
  submitLabel?: string;
  /** When true, limit mode cannot be changed (existing service). */
  lockLimitMode?: boolean;
  onSubmit: (data: ServiceModalSubmit) => void;
  onClose: () => void;
}

export const buildLifetimeInitial = (
  lifetimeEndsAt: string | undefined,
): { lifetime: LifetimeData } => ({
  lifetime: buildLifetimeData(lifetimeEndsAt),
});

export function ServiceModal({
  open,
  initial,
  title = "New service",
  submitLabel = "Add",
  lockLimitMode = false,
  onSubmit,
  onClose,
}: ServiceModalProps) {
  const [name, setName] = useState(initial.name);
  const [limitMode, setLimitMode] = useState<LimitMode>(initial.limitMode);
  const [lifetime, setLifetime] = useState<LifetimeData>(initial.lifetime);
  const [description, setDescription] = useState(initial.description);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setLimitMode(initial.limitMode);
      setLifetime(initial.lifetime);
      setDescription(initial.description);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      limitMode,
      lifetimeEndsAt: lifetimeDataToIso(lifetime),
      description,
    });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-7 py-6 max-h-[78vh] overflow-y-auto">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--text-bright)] mb-7">
            {title}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Service name
              </label>
              <Input
                ref={ref}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3.5 py-2.5 text-base text-[var(--text-bright)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Limit type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={lockLimitMode}
                  onClick={() => setLimitMode("single")}
                  className={`rounded-md border px-5 py-4 text-left text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${limitMode === "single" ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-bright)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"}`}
                >
                  <span className="block font-semibold">Single</span>
                  <span className="block text-sm opacity-70 mt-1">
                    One shared reset
                  </span>
                </button>
                <button
                  type="button"
                  disabled={lockLimitMode}
                  onClick={() => setLimitMode("dailyWeekly")}
                  className={`rounded-md border px-5 py-4 text-left text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${limitMode === "dailyWeekly" ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-bright)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"}`}
                >
                  <span className="block font-semibold">Daily + weekly</span>
                  <span className="block text-sm opacity-70 mt-1">
                    Two separate resets
                  </span>
                </button>
              </div>
            </div>

            <LifetimeFields value={lifetime} onChange={setLifetime} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-soft)]/40 px-7 py-4 rounded-b-xl">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
