import { updateAccount, deleteAccount } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 400 }
      );
    }
    updates.usagePercent = percent;
  }
  if (body.resetsAt !== undefined) updates.resetsAt = body.resetsAt;
  const account = updateAccount(id, updates);
  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json(account);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteAccount(id);
  if (!deleted) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
