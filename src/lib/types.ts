export type LimitMode = "single" | "dailyWeekly";
export type LimitKind = "general" | "daily" | "weekly";

export interface LimitState {
  usagePercent: number; // 0-100, сколько использовано (0=полный лимит, 100=исчерпан)
  resetsAt?: string; // ISO timestamp — когда лимит обнулится
}

export interface AccountLimits {
  general?: LimitState;
  daily?: LimitState;
  weekly?: LimitState;
}

export interface Service {
  id: string;
  name: string;
  order: number; // позиция в списке (меньше = выше)
  activeAccountId?: string; // id выделенного аккаунта
  limitMode: LimitMode; // single = общий лимит, dailyWeekly = дневной + недельный
}

export interface Account {
  id: string;
  serviceId: string;
  name: string;
  limits: AccountLimits;
  /** @deprecated migrated to limits.general or limits.daily */
  usagePercent?: number;
  /** @deprecated migrated to limits.general or limits.daily */
  resetsAt?: string;
}

export interface LifeLimit {
  id: string;
  name: string;
  deadline: string; // ISO timestamp
}

export interface Store {
  services: Service[];
  accounts: Account[];
  lifeLimits: LifeLimit[];
}
