import { v4 as uuidv4 } from 'uuid';

export function nowISO() {
  return new Date().toISOString();
}

export function newRecord<T extends object>(payload: any) {
  const id = uuidv4();
  const now = nowISO();
  return { ...(payload || {}), id, createdAt: now, modifiedAt: now } as T;
}
