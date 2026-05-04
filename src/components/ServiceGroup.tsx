import { Service, Account } from "@/lib/types";
import { isExpired } from "@/lib/time";
import { AccountRow } from "@/components/AccountRow";

interface ServiceGroupProps {
  service: Service;
  accounts: Account[];
  isFirst: boolean;
  activeAccountId: string | null;
  onToggleActive: (id: string) => void;
  onAddAccount: (serviceId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onMoveUp: (serviceId: string) => void;
  onDeleteService: (id: string) => void;
}

export function ServiceGroup({
  service,
  accounts,
  isFirst,
  activeAccountId,
  onToggleActive,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onMoveUp,
  onDeleteService,
}: ServiceGroupProps) {
  const sorted = [...accounts].sort((a, b) => {
    // sort by resetsAt — soonest first
    if (a.resetsAt && b.resetsAt) return new Date(a.resetsAt).getTime() - new Date(b.resetsAt).getTime();
    if (a.resetsAt) return -1;
    if (b.resetsAt) return 1;
    // no resetsAt — sort by usage percent
    const aDisplay = isExpired(a.resetsAt) ? 0 : a.usagePercent;
    const bDisplay = isExpired(b.resetsAt) ? 0 : b.usagePercent;
    return aDisplay - bDisplay;
  });

  return (
    <div className="border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{service.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onMoveUp(service.id)}
            disabled={isFirst}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-500 hover:bg-[var(--hover)] hover:border-gray-400 disabled:opacity-30 disabled:pointer-events-none"
          >
            ↑
          </button>
          <button
            onClick={() => onAddAccount(service.id)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-gray-500 hover:text-[var(--text-bright)] hover:border-gray-400"
          >
            + Account
          </button>
          <button
            onClick={() => onDeleteService(service.id)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-gray-500 hover:text-red-500 hover:border-red-500/30"
          >
            delete
          </button>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-base text-gray-400 py-2">No accounts yet</p>
      ) : (
        <div>
          {sorted.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              isActive={acc.id === activeAccountId}
              onToggleActive={onToggleActive}
              onEdit={onEditAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
