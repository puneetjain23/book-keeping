export type ID = string;

export interface BaseRecord {
  id: ID;
  createdAt: string;
  modifiedAt: string;
}

export interface Project extends BaseRecord {
  name: string;
  notes?: string;
}

export interface Party extends BaseRecord {
  name: string;
  contact?: string;
  address?: string;
}

export interface Flat extends BaseRecord {
  projectId: ID;
  partyId?: ID;
  flatNo: string;
  areaSqft: number;
  ratePerSqft: number;
  amount: number;
  notes?: string;
}

export interface Transaction extends BaseRecord {
  projectId: ID;
  partyId?: ID;
  flatId?: ID;
  bankAmount: number;
  cashAmount: number;
  totalAmount: number;
  mode?: 'receipt' | 'payment';
  reference?: string;
  remarks?: string;
  transactionDate: any;
}
