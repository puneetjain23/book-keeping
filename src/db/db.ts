import Dexie, { Table } from 'dexie';
import { Project, Party, Flat, Transaction } from './types';

class MyDB extends Dexie {
  projects!: Table<Project, string>;
  parties!: Table<Party, string>;
  flats!: Table<Flat, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('homeBuilderBookkeeping');
    this.version(1).stores({
      projects: 'id, name, createdAt, modifiedAt',
      parties: 'id, name, contact, createdAt, modifiedAt',
      flats: 'id, projectId, partyId, flatNo, amount, createdAt, modifiedAt',
      transactions: 'id, projectId, partyId, flatId, totalAmount, transactionDate, createdAt, modifiedAt'
    });
  }
}

export const db = new MyDB();
