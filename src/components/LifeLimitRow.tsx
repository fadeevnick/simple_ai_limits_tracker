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
