import { Account } from "@/lib/types";
import { isExpired, formatTimeLeft } from "@/lib/time";

interface AccountRowProps {
  account: Account;
  isActive: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountRow({ account, isActive, onToggleActive, onEdit, onDelete }: AccountRowProps) {
  const expired = isExpired(account.resetsAt);
  const displayPercent = expired ? 0 : account.usagePercent;
  const isFull = displayPercent >= 100;
  const isAvailable = !isFull;

  const timeLabel = account.resetsAt && !isExpired(account.resetsAt)
    ? formatTimeLeft(account.resetsAt)
    : isAvailable
    ? "available"
    : "—";

  return (
    <div
      className={`flex items-center gap-4 py-3 cursor-pointer rounded-md px-2 -mx-2 transition-colors ${isActive ? "bg-[var(--fill)]/15 border-l-2 border-[var(--fill)]" : "hover:bg-[var(--hover)]"} ${isFull ? "opacity-50" : ""}`}
      onClick={() => onToggleActive(account.id)}
    >
      <span className={`text-base w-40 truncate ${isFull ? "line-through text-gray-400" : ""}`}>{account.name}</span>
      <div className="flex-1 h-2 bg-[var(--tab-inactive)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-500/70" : "bg-[var(--fill)]/50"}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <span className={`text-base font-mono w-16 text-right ${isFull ? "text-red-500 font-semibold" : "text-gray-500"}`}>
        {displayPercent}%
      </span>
      <span className="text-base font-mono w-32 text-right">
        {timeLabel}
      </span>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(account)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:bg-[var(--hover)] hover:border-gray-400">edit</button>
        <button onClick={() => onDelete(account.id)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50">del</button>
      </div>
    </div>
  );
}
