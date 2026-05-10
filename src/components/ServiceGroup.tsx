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
  const visibleAccounts = accounts.filter((a) => a.status === "ACTIVE");
  const groups = groupAccountsByLocalPart(service, visibleAccounts);

  const lifetimeExpired =
    !!service.lifetimeEndsAt &&
    new Date(service.lifetimeEndsAt).getTime() < Date.now();

  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm shadow-black/[0.02]">
      <header className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text-bright)]">
            <Link
              href={`/services/${service.id}`}
              className="hover:underline underline-offset-4 decoration-[var(--border-strong)]"
            >
              {service.name}
            </Link>
          </h2>
          <div className="flex items-center gap-4 mt-2 text-base">
            <span className="uppercase text-xs tracking-wider font-bold text-[var(--text-muted)]">
              {service.limitMode === "dailyWeekly"
                ? "daily + weekly"
                : "single limit"}
            </span>
            {service.lifetimeEndsAt && (
              <>
                <span className="text-[var(--text-faint)]">·</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                    lifetime
                  </span>
                  <span
                    className={`font-mono tabular-nums text-lg font-bold ${lifetimeExpired ? "text-red-600" : "text-[var(--text-bright)]"}`}
                  >
                    {lifetimeExpired
                      ? "expired"
                      : formatTimeLeft(service.lifetimeEndsAt)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onMoveUp(service.id)}
            disabled={isFirst}
            className="w-9 h-9 grid place-items-center text-base font-medium border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text-bright)] hover:border-[var(--border-strong)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onAddAccount(service.id)}
            className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--hover)] hover:border-[var(--border-strong)] transition-colors"
          >
            + Account
          </button>
          <button
            onClick={() => onDeleteService(service.id)}
            className="px-3.5 py-2 text-sm font-medium border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </header>
      {groups.length === 0 ? (
        <p className="text-base text-[var(--text-faint)] py-6 text-center">
          No accounts yet
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group, idx) => (
            <div
              key={idx}
              className="space-y-1 divide-y divide-[var(--border)]/60"
            >
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
    </section>
  );
}
