import { deleteService } from "@/lib/store";

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
