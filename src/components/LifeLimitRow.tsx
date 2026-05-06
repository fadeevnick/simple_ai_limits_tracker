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
    <div className="flex items-center gap-5 py-4">
      <span className="text-lg flex-1 truncate">{limit.name}</span>
      <span
        className={`text-lg font-mono w-36 text-right ${overdue ? "text-red-600" : ""}`}
      >
        {formatDeadline(limit.deadline)}
      </span>
      <span className="text-base font-mono w-44 text-right text-gray-400">
        {new Date(limit.deadline).toLocaleString("ru-RU", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(limit)}
          className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-600 hover:bg-[var(--hover)] hover:border-gray-400"
        >
          edit
        </button>
        <button
          onClick={() => onDelete(limit.id)}
          className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-50"
        >
          del
        </button>
      </div>
    </div>
  );
}
