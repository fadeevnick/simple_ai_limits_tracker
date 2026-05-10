import { Account, LimitKind, LimitMode, LimitState } from "@/lib/types";
import { formatTimeLeft } from "@/lib/time";
import { getDisplayLimit } from "@/lib/limits";
import { statusPillClass } from "@/lib/accountStatus";

interface AccountRowProps {
  account: Account;
  limitMode: LimitMode;
  isActive: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function getBarColor(percent: number) {
  if (percent >= 80) return "bg-red-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-[var(--fill)]";
}

function renderLifetime(lifetimeEndsAt: string | undefined) {
  if (!lifetimeEndsAt) {
    return (
      <span className="text-base text-[var(--text-faint)] font-normal">
        not set
      </span>
    );
  }
  if (new Date(lifetimeEndsAt).getTime() < Date.now()) {
    return <span className="text-red-600 font-bold">expired</span>;
  }
  return (
    <span className="text-[var(--text-bright)] font-bold">
      {formatTimeLeft(lifetimeEndsAt)}
    </span>
  );
}

function timeLabel(limit: LimitState) {
  if (!limit.resetsAt) return "—";
  if (new Date(limit.resetsAt).getTime() < Date.now()) return "—";
  return formatTimeLeft(limit.resetsAt);
}

function LimitBar({ label, limit }: { label?: string; limit: LimitState }) {
  return (
    <div className="flex items-center gap-4 flex-1 min-w-0">
      {label && (
        <span className="text-sm uppercase tracking-wider text-[var(--text-muted)] w-16 font-bold">
          {label}
        </span>
      )}
      <div className="flex-1 h-3.5 bg-[var(--track)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(limit.usagePercent)}`}
          style={{ width: `${limit.usagePercent}%` }}
        />
      </div>
      <span
        className={`text-xl font-mono tabular-nums font-bold w-16 text-right ${limit.usagePercent >= 100 ? "text-red-600" : "text-[var(--text-bright)]"}`}
      >
        {limit.usagePercent}%
      </span>
      <span className="text-base font-mono tabular-nums w-32 text-right text-[var(--text-bright)] font-medium">
        {timeLabel(limit)}
      </span>
    </div>
  );
}

function accountIsFull(account: Account, limitMode: LimitMode) {
  if (limitMode === "dailyWeekly") {
    return (
      getDisplayLimit(account, "daily").usagePercent >= 100 &&
      getDisplayLimit(account, "weekly").usagePercent >= 100
    );
  }
  return getDisplayLimit(account, "general").usagePercent >= 100;
}

export function AccountRow({
  account,
  limitMode,
  isActive,
  onToggleActive,
  onEdit,
  onDelete,
}: AccountRowProps) {
  const isFull = accountIsFull(account, limitMode);
  const rowClass = `flex items-center gap-6 py-5 px-4 cursor-pointer rounded-lg transition-colors ${
    isActive
      ? "bg-[var(--primary)]/[0.06] ring-1 ring-inset ring-[var(--primary)]/20"
      : "hover:bg-[var(--hover)]"
  } ${isFull ? "opacity-55" : ""}`;

  const renderLimit = (kind: LimitKind, label?: string) => (
    <LimitBar label={label} limit={getDisplayLimit(account, kind)} />
  );

  return (
    <div className={rowClass} onClick={() => onToggleActive(account.id)}>
      {/* Identity column */}
      <div className="w-72 min-w-0 shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-lg font-semibold text-[var(--text-bright)] truncate ${isFull ? "line-through text-[var(--text-faint)]" : ""}`}
            title={account.email}
          >
            {account.email}
          </span>
          <span
            className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${statusPillClass(account.status)}`}
          >
            {account.status}
          </span>
        </div>
        {account.tags && account.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {account.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lifetime column — only when set */}
      {account.lifetimeEndsAt && (
        <div className="w-52 shrink-0">
          <div className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-bold mb-1.5">
            Lifetime
          </div>
          <div className="text-xl font-mono tabular-nums">
            {renderLifetime(account.lifetimeEndsAt)}
          </div>
        </div>
      )}

      {/* Limits column */}
      <div className="flex-1 min-w-0">
        <div className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">
          {limitMode === "dailyWeekly" ? "Limits" : "Limit"}
        </div>
        {limitMode === "dailyWeekly" ? (
          <div className="space-y-2.5">
            {renderLimit("daily", "daily")}
            {renderLimit("weekly", "weekly")}
          </div>
        ) : (
          renderLimit("general")
        )}
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(account)}
          className="px-3.5 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--hover)] hover:border-[var(--border-strong)] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="px-3.5 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
