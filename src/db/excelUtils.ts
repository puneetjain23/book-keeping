import * as XLSX from 'xlsx';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

export async function exportAllToExcel() {
  const [projects, parties, flats, transactions] = await Promise.all([
    db.projects.toArray(),
    db.parties.toArray(),
    db.flats.toArray(),
    db.transactions.toArray()
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projects), 'Projects');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parties), 'Parties');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flats), 'Flats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Transactions');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookkeeping-export-${new Date().toISOString().slice(0,10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromExcel(file: File) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  async function handleSheet(name: string, table: any) {
    if (!wb.Sheets[name]) return;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null }) as any[];
    for (const r of rows) {
      const id = r.id || uuidv4();
      const now = new Date().toISOString();
      const record = { ...r, id, createdAt: r.createdAt || now, modifiedAt: now, transactionDate: new Date(r.transactionDate) };
      await table.put(record);
    }
  }

  await db.transaction('rw', db.projects, db.parties, db.flats, db.transactions, async () => {
    await handleSheet('Projects', db.projects);
    await handleSheet('Parties', db.parties);
    await handleSheet('Flats', db.flats);
    await handleSheet('Transactions', db.transactions);
  });
}

export async function clearAllData() {
  await db.transaction('rw', db.projects, db.parties, db.flats, db.transactions, async () => {
    await Promise.all([
      db.projects.clear(),
      db.parties.clear(),
      db.flats.clear(),
      db.transactions.clear()
    ]);
  });
}
