import { LifeLimit } from "@/lib/types";
import { formatDeadline } from "@/lib/time";

interface LifeLimitRowProps {
  limit: LifeLimit;
  onEdit: (limit: LifeLimit) => void;
  onDelete: (id: string) => void;
}

export function LifeLimitRow({ limit, onEdit, onDelete }: LifeLimitRowProps) {
  const overdue = new Date(limit.deadline).getTime() < Date.now();

  return (
    <div className="flex items-center gap-6 py-5 px-3 rounded-lg hover:bg-[var(--hover)] transition-colors">
      <span className="text-lg font-semibold text-[var(--text-bright)] flex-1 truncate">
        {limit.name}
      </span>
      <span
        className={`text-base font-mono tabular-nums w-40 text-right ${overdue ? "text-red-600 font-semibold" : "text-[var(--text-bright)] font-medium"}`}
      >
        {formatDeadline(limit.deadline)}
      </span>
      <span className="text-sm font-mono tabular-nums w-44 text-right text-[var(--text-muted)]">
        {new Date(limit.deadline).toLocaleString("ru-RU", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(limit)}
          className="px-3.5 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--hover)] hover:border-[var(--border-strong)] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(limit.id)}
          className="px-3.5 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
