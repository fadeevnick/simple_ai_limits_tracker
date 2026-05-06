export interface Service {
  id: string;
  name: string;
  order: number;        // позиция в списке (меньше = выше)
  activeAccountId?: string; // id выделенного аккаунта
}

export interface Account {
  id: string;
  serviceId: string;
  name: string;
  usagePercent: number; // 0-100, сколько использовано (0=полный лимит, 100=исчерпан)
  resetsAt?: string;    // ISO timestamp — когда лимит обнулится
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
