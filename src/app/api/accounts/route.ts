import { readStore, addAccount } from "@/lib/store";

export async function GET() {
  const store = readStore();
  return Response.json(store.accounts);
}

export async function POST(request: Request) {
  const { serviceId, name, usagePercent, resetsAt } = await request.json();
  if (!serviceId || !name || usagePercent === undefined) {
    return Response.json(
      { error: "serviceId, name, and usagePercent are required" },
      { status: 400 }
    );
  }
  const percent = Number(usagePercent);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    return Response.json(
      { error: "usagePercent must be 0-100" },
      { status: 400 }
    );
  }
  const account = addAccount(serviceId, name.trim(), percent, resetsAt);
  if (!account) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }
  return Response.json(account, { status: 201 });
}
