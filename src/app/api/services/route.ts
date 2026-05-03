import { readStore, addService } from "@/lib/store";

export async function GET() {
  const store = readStore();
  return Response.json(store.services);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  const service = addService(name.trim());
  return Response.json(service, { status: 201 });
}
