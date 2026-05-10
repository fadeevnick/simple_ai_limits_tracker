import {
  deleteService,
  reorderService,
  setActiveAccount,
  updateService,
} from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  if (body.direction === "up") {
    const service = reorderService(id);
    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }
    return Response.json(service);
  }
  if (body.activeAccountId !== undefined) {
    const service = setActiveAccount(id, body.activeAccountId);
    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }
    return Response.json(service);
  }
  if (
    body.name !== undefined ||
    body.lifetimeEndsAt !== undefined ||
    body.description !== undefined
  ) {
    const updates: {
      name?: string;
      lifetimeEndsAt?: string;
      description?: string;
    } = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return Response.json(
          { error: "name must be a non-empty string" },
          { status: 400 },
        );
      }
      updates.name = body.name.trim();
    }
    if (body.lifetimeEndsAt !== undefined) {
      // null/"" clears it
      updates.lifetimeEndsAt =
        body.lifetimeEndsAt === null ? "" : String(body.lifetimeEndsAt);
    }
    if (body.description !== undefined) {
      updates.description =
        body.description === null ? "" : String(body.description);
    }
    const service = updateService(id, updates);
    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }
    return Response.json(service);
  }
  return Response.json({ error: "Unsupported action" }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteService(id);
  if (!deleted) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
