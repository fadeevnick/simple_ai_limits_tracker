import { Account, LimitKind, LimitMode, LimitState } from "@/lib/types";
import { formatTimeLeft } from "@/lib/time";
import { getDisplayLimit } from "@/lib/limits";

interface AccountRowProps {
  account: Account;
  limitMode: LimitMode;
  isActive: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function getBarColor(percent: number) {
  if (percent >= 80) return "bg-red-500/70";
  if (percent >= 50) return "bg-yellow-500/70";
  return "bg-[var(--fill)]/50";
}

function timeLabel(limit: LimitState) {
  if (limit.usagePercent === 0) return "available";
  if (!limit.resetsAt) return "—";
  if (new Date(limit.resetsAt).getTime() < Date.now()) return "available";
  return formatTimeLeft(limit.resetsAt);
}

function LimitBar({ label, limit }: { label?: string; limit: LimitState }) {
  return (
    <div className="flex items-center gap-4 flex-1 min-w-0">
      {label && (
        <span className="text-sm uppercase tracking-wide text-gray-400 w-16">
          {label}
        </span>
      )}
      <div className="flex-1 h-2.5 bg-[var(--tab-inactive)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(limit.usagePercent)}`}
          style={{ width: `${limit.usagePercent}%` }}
        />
      </div>
      <span
        className={`text-base font-mono w-14 text-right ${limit.usagePercent >= 100 ? "text-red-500 font-semibold" : "text-gray-500"}`}
      >
        {limit.usagePercent}%
      </span>
      <span className="text-base font-mono w-32 text-right">
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
  const rowClass = `flex items-center gap-5 py-4 cursor-pointer rounded-lg px-3 -mx-3 transition-colors ${isActive ? "bg-[var(--fill)]/15 border-l-2 border-[var(--fill)]" : "hover:bg-[var(--hover)]"} ${isFull ? "opacity-50" : ""}`;

  const renderLimit = (kind: LimitKind, label?: string) => (
    <LimitBar label={label} limit={getDisplayLimit(account, kind)} />
  );

  return (
    <div className={rowClass} onClick={() => onToggleActive(account.id)}>
      <span
        className={`text-lg w-52 truncate ${isFull ? "line-through text-gray-400" : ""}`}
      >
        {account.name}
      </span>

      {limitMode === "dailyWeekly" ? (
        <div className="flex-1 space-y-2.5 min-w-0">
          {renderLimit("daily", "daily")}
          {renderLimit("weekly", "weekly")}
        </div>
      ) : (
        renderLimit("general")
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(account)}
          className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-600 hover:bg-[var(--hover)] hover:border-gray-400"
        >
          edit
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50"
        >
          del
        </button>
      </div>
    </div>
  );
}
