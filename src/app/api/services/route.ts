import { readStore, addService } from "@/lib/store";
import type { LimitMode } from "@/lib/types";

function isLimitMode(value: unknown): value is LimitMode {
  return value === "single" || value === "dailyWeekly";
}

export async function GET() {
  const store = readStore();
  return Response.json(store.services);
}

export async function POST(request: Request) {
  const {
    name,
    limitMode = "single",
    lifetimeEndsAt,
    description,
  } = await request.json();
  if (!name || typeof name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!isLimitMode(limitMode)) {
    return Response.json(
      { error: "limitMode must be single or dailyWeekly" },
      { status: 400 },
    );
  }
  const lifetime =
    typeof lifetimeEndsAt === "string" && lifetimeEndsAt
      ? lifetimeEndsAt
      : undefined;
  const service = addService(
    name.trim(),
    limitMode,
    lifetime,
    typeof description === "string" ? description : undefined,
  );
  return Response.json(service, { status: 201 });
}
