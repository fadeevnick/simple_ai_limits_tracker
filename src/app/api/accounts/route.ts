import { readStore, addAccount } from "@/lib/store";
import type { AccountLimits, AccountStatus, LimitState } from "@/lib/types";

function isAccountStatus(value: unknown): value is AccountStatus {
  return (
    value === "ACTIVE" ||
    value === "BLOCKED" ||
    value === "NOT_ELEGIBLE_FOR_FREE"
  );
}

function isValidLimit(limit: LimitState | undefined): boolean {
  if (!limit) return true;
  const percent = Number(limit.usagePercent);
  return Number.isFinite(percent) && percent >= 0 && percent <= 100;
}

function areValidLimits(limits: AccountLimits | undefined): boolean {
  if (!limits) return true;
  return (
    isValidLimit(limits.general) &&
    isValidLimit(limits.daily) &&
    isValidLimit(limits.weekly)
  );
}

export async function GET() {
  const store = readStore();
  return Response.json(store.accounts);
}

export async function POST(request: Request) {
  const {
    serviceId,
    email,
    password,
    status,
    tags,
    usagePercent = 0,
    resetsAt,
    limits,
  } = await request.json();
  if (!serviceId || !email) {
    return Response.json(
      { error: "serviceId and email are required" },
      { status: 400 },
    );
  }
  const percent = Number(usagePercent);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    return Response.json(
      { error: "usagePercent must be 0-100" },
      { status: 400 },
    );
  }
  if (!areValidLimits(limits)) {
    return Response.json(
      { error: "all limit usagePercent values must be 0-100" },
      { status: 400 },
    );
  }
  if (status !== undefined && !isAccountStatus(status)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }
  const account = addAccount({
    serviceId,
    email: String(email).trim(),
    password: typeof password === "string" ? password : undefined,
    status: isAccountStatus(status) ? status : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    usagePercent: percent,
    resetsAt,
    limits,
  });
  if (!account) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }
  return Response.json(account, { status: 201 });
}
