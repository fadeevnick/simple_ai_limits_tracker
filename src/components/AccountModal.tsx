import { useState, useEffect, useRef } from "react";
import type { AccountStatus, LimitMode } from "@/lib/types";
import { ACCOUNT_STATUSES } from "@/lib/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  LifetimeData,
  LifetimeFields,
} from "@/components/ui/LifetimeFields";

export type ResetMode = "duration" | "date";

export interface LimitModalData {
  usagePercent: number;
  days: number;
  hours: number;
  minutes: number;
  resetDate: string;
  resetMode: ResetMode;
}

export interface AccountModalData {
  email: string;
  password: string;
  status: AccountStatus;
  tags: string[];
  lifetime: LifetimeData;
  general: LimitModalData;
  daily: LimitModalData;
  weekly: LimitModalData;
}

function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

interface AccountModalProps {
  open: boolean;
  title: string;
  limitMode: LimitMode;
  initial: AccountModalData;
  onSubmit: (data: AccountModalData) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

const emptyLimit = (): LimitModalData => ({
  usagePercent: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  resetDate: "",
  resetMode: "duration",
});

function LimitFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: LimitModalData;
  onChange: (value: LimitModalData) => void;
}) {
  const update = (patch: Partial<LimitModalData>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/40 p-4">
      <h4 className="text-sm font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-4">
        {title}
      </h4>
      <div className="space-y-5">
        <div>
          <label className="flex items-baseline justify-between text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            <span>Usage</span>
            <span className="font-mono tabular-nums text-lg text-[var(--text-bright)]">
              {value.usagePercent}%
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={value.usagePercent}
            onChange={(e) => update({ usagePercent: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Resets
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => update({ resetMode: "duration" })}
              className={`px-4 py-2 text-base rounded-md border transition-colors ${value.resetMode === "duration" ? "border-[var(--border-strong)] text-[var(--text-bright)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"}`}
            >
              in
            </button>
            <button
              type="button"
              onClick={() => update({ resetMode: "date" })}
              className={`px-4 py-2 text-base rounded-md border transition-colors ${value.resetMode === "date" ? "border-[var(--border-strong)] text-[var(--text-bright)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"}`}
            >
              on
            </button>
          </div>
          {value.resetMode === "duration" ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={String(value.days)}
                onChange={(e) =>
                  update({
                    days: Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                  })
                }
              />
              <span className="text-base text-[var(--text-muted)] font-medium">d</span>
              <Input
                type="text"
                inputMode="numeric"
                value={String(value.hours)}
                onChange={(e) =>
                  update({
                    hours: Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                  })
                }
              />
              <span className="text-base text-[var(--text-muted)] font-medium">h</span>
              <Input
                type="text"
                inputMode="numeric"
                value={String(value.minutes)}
                onChange={(e) =>
                  update({
                    minutes: Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                  })
                }
              />
              <span className="text-base text-[var(--text-muted)] font-medium">m</span>
            </div>
          ) : (
            <Input
              type="datetime-local"
              value={value.resetDate}
              onChange={(e) => update({ resetDate: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountModal({
  open,
  title,
  limitMode,
  initial,
  onSubmit,
  onClose,
  showDelete,
  onDelete,
}: AccountModalProps) {
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  const [status, setStatus] = useState<AccountStatus>(initial.status);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [lifetime, setLifetime] = useState<LifetimeData>(initial.lifetime);
  const [general, setGeneral] = useState(initial.general ?? emptyLimit());
  const [daily, setDaily] = useState(initial.daily ?? emptyLimit());
  const [weekly, setWeekly] = useState(initial.weekly ?? emptyLimit());
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail(initial.email);
      setPassword(initial.password);
      setStatus(initial.status);
      setTagsInput(initial.tags.join(", "));
      setLifetime(initial.lifetime);
      setGeneral(initial.general ?? emptyLimit());
      setDaily(initial.daily ?? emptyLimit());
      setWeekly(initial.weekly ?? emptyLimit());
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email: email.trim(),
      password,
      status,
      tags: parseTagsInput(tagsInput),
      lifetime,
      general,
      daily,
      weekly,
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
                Account email
              </label>
              <Input
                ref={emailRef}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Password
              </label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                      status === s
                        ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-bright)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Tags
              </label>
              <Input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="comma, separated, tags"
              />
            </div>

            <LifetimeFields value={lifetime} onChange={setLifetime} />

            {limitMode === "dailyWeekly" ? (
              <>
                <LimitFields
                  title="Daily limit"
                  value={daily}
                  onChange={setDaily}
                />
                <LimitFields
                  title="Weekly limit"
                  value={weekly}
                  onChange={setWeekly}
                />
              </>
            ) : (
              <LimitFields
                title="Limit"
                value={general}
                onChange={setGeneral}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-soft)]/40 px-7 py-4 rounded-b-xl">
          {showDelete && onDelete && (
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export { emptyLimit as createEmptyLimitModalData };
