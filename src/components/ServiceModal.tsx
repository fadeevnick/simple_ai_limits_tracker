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
        <div className="p-9 max-h-[75vh] overflow-y-auto">
          <h3 className="text-3xl font-bold mb-8">{title}</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-base text-gray-500 mb-2">
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
              <label className="block text-base text-gray-500 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400 resize-y"
              />
            </div>

            <div>
              <label className="block text-base text-gray-500 mb-2">
                Limit type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={lockLimitMode}
                  onClick={() => setLimitMode("single")}
                  className={`rounded-lg border px-5 py-4 text-left text-base disabled:opacity-50 disabled:cursor-not-allowed ${limitMode === "single" ? "border-gray-400 bg-[var(--hover)] text-[var(--text-bright)]" : "border-[var(--border)] text-gray-500"}`}
                >
                  <span className="block font-medium">Single</span>
                  <span className="block text-sm opacity-70">
                    One shared reset
                  </span>
                </button>
                <button
                  type="button"
                  disabled={lockLimitMode}
                  onClick={() => setLimitMode("dailyWeekly")}
                  className={`rounded-lg border px-5 py-4 text-left text-base disabled:opacity-50 disabled:cursor-not-allowed ${limitMode === "dailyWeekly" ? "border-gray-400 bg-[var(--hover)] text-[var(--text-bright)]" : "border-[var(--border)] text-gray-500"}`}
                >
                  <span className="block font-medium">Daily + weekly</span>
                  <span className="block text-sm opacity-70">
                    Two separate resets
                  </span>
                </button>
              </div>
            </div>

            <LifetimeFields value={lifetime} onChange={setLifetime} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-9 py-5">
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
