import Link from "next/link";
import { Service, Account } from "@/lib/types";
import { getLimit, limitSortTime } from "@/lib/limits";
import { formatTimeLeft } from "@/lib/time";
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

function emailLocalPart(email: string): string {
  const at = email.indexOf("@");
  return (at === -1 ? email : email.slice(0, at)).trim().toLowerCase();
}

function groupAccountsByLocalPart(
  service: Service,
  accounts: Account[],
): Account[][] {
  const groups = new Map<string, Account[]>();
  for (const acc of accounts) {
    const key = emailLocalPart(acc.email);
    const list = groups.get(key);
    if (list) list.push(acc);
    else groups.set(key, [acc]);
  }
  const result: Account[][] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => compareAccounts(service, a, b));
    result.push(list);
  }
  // Sort groups by their leading account (so most-urgent group comes first)
  result.sort((a, b) => compareAccounts(service, a[0], b[0]));
  return result;
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
    return a.email.localeCompare(b.email);
  }

  const generalDiff =
    limitSortTime(getLimit(a, "general")) -
    limitSortTime(getLimit(b, "general"));
  if (generalDiff !== 0) return generalDiff;
  return a.email.localeCompare(b.email);
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
  const groups = groupAccountsByLocalPart(service, accounts);

  return (
    <div className="border border-[var(--border)] rounded-xl p-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            <Link
              href={`/services/${service.id}`}
              className="hover:underline"
            >
              {service.name}
            </Link>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {service.limitMode === "dailyWeekly"
              ? "daily + weekly"
              : "single limit"}
            {service.lifetimeEndsAt && (
              <>
                {" · "}
                <span
                  className={
                    new Date(service.lifetimeEndsAt).getTime() < Date.now()
                      ? "text-red-500"
                      : ""
                  }
                >
                  lifetime:{" "}
                  {new Date(service.lifetimeEndsAt).getTime() < Date.now()
                    ? "expired"
                    : formatTimeLeft(service.lifetimeEndsAt)}
                </span>
              </>
            )}
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
      {groups.length === 0 ? (
        <p className="text-lg text-gray-400 py-3">No accounts yet</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {groups.map((group, idx) => (
            <div key={idx} className="py-1 first:pt-0 last:pb-0">
              {group.map((acc) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
