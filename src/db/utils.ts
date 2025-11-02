import { v4 as uuidv4 } from 'uuid';

export function nowISO() {
  return new Date().toISOString();
}

export function newRecord<T extends object>(payload: any) {
  const id = uuidv4();
  const now = nowISO();
  return { ...(payload || {}), id, createdAt: now, modifiedAt: now } as T;
}

export async function hashPassword(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
