import { Service, Account } from "@/lib/types";
import { getLimit, limitSortTime } from "@/lib/limits";
import { AccountRow } from "@/components/AccountRow";

interface ServiceGroupProps {
  service: Service;
  accounts: Account[];
  isFirst: boolean;
  onToggleActive: (id: string) => void;
  onAddAccount: (serviceId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onMoveUp: (serviceId: string) => void;
  onDeleteService: (id: string) => void;
}

function compareAccounts(service: Service, a: Account, b: Account): number {
  if (service.limitMode === "dailyWeekly") {
    const dailyDiff =
      limitSortTime(getLimit(a, "daily")) - limitSortTime(getLimit(b, "daily"));
    if (dailyDiff !== 0) return dailyDiff;
    const weeklyDiff =
      limitSortTime(getLimit(a, "weekly")) -
      limitSortTime(getLimit(b, "weekly"));
    if (weeklyDiff !== 0) return weeklyDiff;
    return a.name.localeCompare(b.name);
  }

  const generalDiff =
    limitSortTime(getLimit(a, "general")) -
    limitSortTime(getLimit(b, "general"));
  if (generalDiff !== 0) return generalDiff;
  return a.name.localeCompare(b.name);
}

export function ServiceGroup({
  service,
  accounts,
  isFirst,
  onToggleActive,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onMoveUp,
  onDeleteService,
}: ServiceGroupProps) {
  const sorted = [...accounts].sort((a, b) => compareAccounts(service, a, b));

  return (
    <div className="border border-[var(--border)] rounded-xl p-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{service.name}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {service.limitMode === "dailyWeekly"
              ? "daily + weekly"
              : "single limit"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onMoveUp(service.id)}
            disabled={isFirst}
            className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-500 hover:bg-[var(--hover)] hover:border-gray-400 disabled:opacity-30 disabled:pointer-events-none"
          >
            ↑
          </button>
          <button
            onClick={() => onAddAccount(service.id)}
            className="px-5 py-2.5 text-base border border-[var(--border)] rounded-lg text-gray-500 hover:text-[var(--text-bright)] hover:border-gray-400"
          >
            + Account
          </button>
          <button
            onClick={() => onDeleteService(service.id)}
            className="px-4 py-2 text-base border border-[var(--border)] rounded-lg text-gray-500 hover:text-red-500 hover:border-red-500/30"
          >
            delete
          </button>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-lg text-gray-400 py-3">No accounts yet</p>
      ) : (
        <div>
          {sorted.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              limitMode={service.limitMode}
              isActive={acc.id === service.activeAccountId}
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
