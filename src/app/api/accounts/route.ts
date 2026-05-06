import { readStore, addAccount } from "@/lib/store";
import type { AccountLimits, LimitState } from "@/lib/types";

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
    name,
    usagePercent = 0,
    resetsAt,
    limits,
  } = await request.json();
  if (!serviceId || !name) {
    return Response.json(
      { error: "serviceId and name are required" },
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
  const account = addAccount(serviceId, name.trim(), percent, resetsAt, limits);
  if (!account) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }
  return Response.json(account, { status: 201 });
}
