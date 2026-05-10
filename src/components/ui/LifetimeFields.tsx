import { Input } from "@/components/ui/Input";
import { calcResetsAt, getRemainingDHM, toDatetimeLocal } from "@/lib/time";

export type LifetimeMode = "none" | "duration" | "date";

export interface LifetimeData {
  mode: LifetimeMode;
  days: number;
  date: string; // datetime-local
}

export function buildLifetimeData(
  lifetimeEndsAt: string | undefined,
): LifetimeData {
  if (!lifetimeEndsAt) {
    return { mode: "none", days: 0, date: "" };
  }
  const rem = getRemainingDHM(lifetimeEndsAt);
  return {
    mode: "duration",
    days: rem.days,
    date: toDatetimeLocal(lifetimeEndsAt),
  };
}

export function lifetimeDataToIso(data: LifetimeData): string | null {
  if (data.mode === "duration" && data.days > 0) {
    return calcResetsAt(data.days, 0, 0);
  }
  if (data.mode === "date" && data.date) {
    return new Date(data.date).toISOString();
  }
  return null;
}

interface LifetimeFieldsProps {
  value: LifetimeData;
  onChange: (value: LifetimeData) => void;
}

export function LifetimeFields({ value, onChange }: LifetimeFieldsProps) {
  const update = (patch: Partial<LifetimeData>) =>
    onChange({ ...value, ...patch });

  const pillClass = (active: boolean) =>
    `px-4 py-2 text-base rounded-md border transition-colors ${
      active
        ? "border-[var(--border-strong)] text-[var(--text-bright)] bg-[var(--surface-soft)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)]"
    }`;

  return (
    <div>
      <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
        Lifetime
      </label>
      <div className="flex gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => update({ mode: "none" })}
          className={pillClass(value.mode === "none")}
        >
          none
        </button>
        <button
          type="button"
          onClick={() => update({ mode: "duration" })}
          className={pillClass(value.mode === "duration")}
        >
          in
        </button>
        <button
          type="button"
          onClick={() => update({ mode: "date" })}
          className={pillClass(value.mode === "date")}
        >
          on
        </button>
      </div>
      {value.mode === "duration" && (
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
          <span className="text-base text-[var(--text-muted)] font-medium">days</span>
        </div>
      )}
      {value.mode === "date" && (
        <Input
          type="datetime-local"
          value={value.date}
          onChange={(e) => update({ date: e.target.value })}
        />
      )}
    </div>
  );
}
