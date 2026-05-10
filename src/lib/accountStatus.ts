import type { AccountStatus } from "./types";

export const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  NOT_ELEGIBLE_FOR_FREE: "NOT_ELEGIBLE_FOR_FREE",
};

export function statusColorClass(status: AccountStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-600";
    case "BLOCKED":
      return "text-red-600";
    case "NOT_ELEGIBLE_FOR_FREE":
      return "text-amber-800";
  }
}
