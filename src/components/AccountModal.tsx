import { useState, useEffect, useRef } from "react";
import type { LimitMode } from "@/lib/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
  name: string;
  general: LimitModalData;
  daily: LimitModalData;
  weekly: LimitModalData;
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
    <div className="rounded-xl border border-[var(--border)] p-5">
      <h4 className="text-lg font-semibold text-[var(--text-bright)] mb-4">
        {title}
      </h4>
      <div className="space-y-5">
        <div>
          <label className="block text-base text-gray-500 mb-2">
            Usage — {value.usagePercent}%
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
          <label className="block text-base text-gray-500 mb-2">Resets</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => update({ resetMode: "duration" })}
              className={`px-4 py-2 text-base rounded-lg border ${value.resetMode === "duration" ? "border-gray-400 text-[var(--text-bright)] bg-[var(--hover)]" : "border-[var(--border)] text-gray-500"}`}
            >
              in
            </button>
            <button
              type="button"
              onClick={() => update({ resetMode: "date" })}
              className={`px-4 py-2 text-base rounded-lg border ${value.resetMode === "date" ? "border-gray-400 text-[var(--text-bright)] bg-[var(--hover)]" : "border-[var(--border)] text-gray-500"}`}
            >
              on
            </button>
          </div>
          {value.resetMode === "duration" ? (
            <div className="flex items-center gap-3">
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
              <span className="text-base text-gray-400">d</span>
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
              <span className="text-base text-gray-400">h</span>
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
              <span className="text-base text-gray-400">m</span>
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
  const [name, setName] = useState(initial.name);
  const [general, setGeneral] = useState(initial.general ?? emptyLimit());
  const [daily, setDaily] = useState(initial.daily ?? emptyLimit());
  const [weekly, setWeekly] = useState(initial.weekly ?? emptyLimit());
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setGeneral(initial.general ?? emptyLimit());
      setDaily(initial.daily ?? emptyLimit());
      setWeekly(initial.weekly ?? emptyLimit());
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), general, daily, weekly });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-9 max-h-[75vh] overflow-y-auto">
          <h3 className="text-3xl font-bold mb-8">{title}</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-base text-gray-500 mb-2">
                Account name
              </label>
              <Input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-9 py-5">
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
