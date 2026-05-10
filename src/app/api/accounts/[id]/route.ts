import { updateAccount, deleteAccount } from "@/lib/store";
import type { AccountLimits, AccountStatus, LimitState } from "@/lib/types";

function isAccountStatus(value: unknown): value is AccountStatus {
  return (
    value === "ACTIVE" ||
    value === "BLOCKED" ||
    value === "NOT_ELEGIBLE_FOR_ACTIVATION"
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.email !== undefined) updates.email = String(body.email).trim();
  if (body.password !== undefined) updates.password = String(body.password);
  if (body.status !== undefined) {
    if (!isAccountStatus(body.status)) {
      return Response.json({ error: "invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return Response.json(
        { error: "tags must be an array" },
        { status: 400 },
      );
    }
    updates.tags = body.tags;
  }
  if (body.lifetimeEndsAt !== undefined) {
    updates.lifetimeEndsAt =
      body.lifetimeEndsAt === null ? "" : String(body.lifetimeEndsAt);
  }
  if (body.usagePercent !== undefined) {
    const percent = Number(body.usagePercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return Response.json(
        { error: "usagePercent must be 0-100" },
        { status: 400 },
      );
    }
    updates.usagePercent = percent;
  }
  if (body.resetsAt !== undefined) updates.resetsAt = body.resetsAt;
  if (body.limits !== undefined) {
    if (!areValidLimits(body.limits)) {
      return Response.json(
        { error: "all limit usagePercent values must be 0-100" },
        { status: 400 },
      );
    }
    updates.limits = body.limits;
  }
  const account = updateAccount(id, updates);
  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json(account);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteAccount(id);
  if (!deleted) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
