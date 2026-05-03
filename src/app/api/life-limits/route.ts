import { readStore, addLifeLimit } from "@/lib/store";

export async function GET() {
  const store = readStore();
  return Response.json(store.lifeLimits);
}

export async function POST(request: Request) {
  const { name, deadline } = await request.json();
  if (!name || !deadline) {
    return Response.json({ error: "name and deadline are required" }, { status: 400 });
  }
  const limit = addLifeLimit(name.trim(), deadline);
  return Response.json(limit, { status: 201 });
}
