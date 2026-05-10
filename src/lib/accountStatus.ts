import type { AccountStatus } from "./types";

export const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  NOT_ELEGIBLE_FOR_ACTIVATION: "NOT_ELEGIBLE_FOR_ACTIVATION",
};

export function statusColorClass(status: AccountStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-700";
    case "BLOCKED":
      return "text-red-600";
    case "NOT_ELEGIBLE_FOR_ACTIVATION":
      return "text-amber-800";
  }
}

export function statusPillClass(status: AccountStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-700 bg-green-50 border-green-200";
    case "BLOCKED":
      return "text-red-700 bg-red-50 border-red-200";
    case "NOT_ELEGIBLE_FOR_ACTIVATION":
      return "text-amber-800 bg-amber-50 border-amber-200";
  }
}
