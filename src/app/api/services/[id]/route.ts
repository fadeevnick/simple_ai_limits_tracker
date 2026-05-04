import { deleteService, reorderService } from "@/lib/store";

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
