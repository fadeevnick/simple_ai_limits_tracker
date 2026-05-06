import { updateAccount, deleteAccount } from "@/lib/store";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
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
