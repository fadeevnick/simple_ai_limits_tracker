import { updateLifeLimit, deleteLifeLimit } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, string> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.deadline !== undefined) updates.deadline = body.deadline;
  const limit = updateLifeLimit(id, updates);
  if (!limit) {
    return Response.json({ error: "Life limit not found" }, { status: 404 });
  }
  return Response.json(limit);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteLifeLimit(id);
  if (!deleted) {
    return Response.json({ error: "Life limit not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
