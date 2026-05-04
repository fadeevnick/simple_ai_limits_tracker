export function formatTimeLeft(resetsAt: string): string {
  const diff = new Date(resetsAt).getTime() - Date.now();
  if (diff <= 0) return "now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function calcResetsAt(days: number, hours: number, minutes: number): string {
  return new Date(Date.now() + days * 86400000 + hours * 3600000 + minutes * 60000).toISOString();
}

export function isExpired(resetsAt?: string): boolean {
  if (!resetsAt) return false;
  return new Date(resetsAt).getTime() < Date.now();
}

export function getRemainingDHM(resetsAt?: string): { days: number; hours: number; minutes: number } {
  if (!resetsAt || isExpired(resetsAt)) return { days: 0, hours: 0, minutes: 0 };
  const diff = new Date(resetsAt).getTime() - Date.now();
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

export function toDatetimeLocal(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}