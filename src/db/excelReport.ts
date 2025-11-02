import ExcelJS from 'exceljs';
import { db } from './db';
import { toast } from 'react-toastify';

interface ReportFilters {
  projectId?: string;
  partyId?: string;
  completionPercent?: number;
}

export async function generateExcelReport(filters: ReportFilters) {
  const { projectId, partyId, completionPercent = 100 } = filters;

  // Fetch Dexie data
  const projects = await db.projects.toArray();
  const parties = await db.parties.toArray();
  const flatsAll = await db.flats.toArray();
  const transactionsAll = await db.transactions.toArray();

  const flats = flatsAll
    .filter(f => !projectId || f.projectId === projectId)
    .filter(f => !partyId || f.partyId === partyId);
  const transactions = transactionsAll
    .filter(t => !projectId || t.projectId === projectId)
    .filter(t => !partyId || t.partyId === partyId);

  // --- Party Summary ---
  const partyMap = new Map<string, { name: string; expected: number; received: number }>();
  for (const f of flats) {
    const pid = f.partyId || 'UNASSIGNED';
    const prev = partyMap.get(pid) || {
      name: parties.find(p => p.id === pid)?.name || 'Unknown',
      expected: 0,
      received: 0,
    };
    prev.expected += (f.amount || 0) * (completionPercent / 100);
    partyMap.set(pid, prev);
  }
  for (const t of transactions) {
    const pid = t.partyId || 'UNASSIGNED';
    const prev = partyMap.get(pid) || {
      name: parties.find(p => p.id === pid)?.name || 'Unknown',
      expected: 0,
      received: 0,
    };
    prev.received += t.totalAmount || 0;
    partyMap.set(pid, prev);
  }

  const summaryData = Array.from(partyMap.values())
    .map(p => ({
      Party: p.name,
      'Expected Amount': p.expected,
      'Received Amount': p.received,
      '% Difference': 100 - (p.expected === 0 ? 0 : Math.round((p.received / p.expected) * 100)),
      'Balance Due': p.expected - p.received,
    }))
    .sort((a, b) => b['% Difference'] - a['% Difference']);

  // --- KPIs ---
  const totalExpected = summaryData.reduce((s, p) => s + p['Expected Amount'], 0);
  const totalReceived = summaryData.reduce((s, p) => s + p['Received Amount'], 0);
  const percentCollected = totalExpected ? (totalReceived / totalExpected) * 100 : 0;
  const totalOutstanding = totalExpected - totalReceived;

  // --- Detailed Transactions ---
  const detailedData = transactions.map(t => ({
    Date: t.transactionDate.toLocaleString(),
    Project: projects.find(p => p.id === t.projectId)?.name || 'Unknown',
    Party: parties.find(p => p.id === t.partyId)?.name || 'Unknown',
    Flat: flats.find(f => f.id === t.flatId)?.flatNo || '-',
    'Bank Amount': t.bankAmount,
    'Cash Amount': t.cashAmount,
    'Total Amount': t.totalAmount,
  }));

  // --- Workbook & Summary Sheet ---
  const wb = new ExcelJS.Workbook();
  const wsSummary = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 6 }] });

  // KPIs at top
  wsSummary.addRow(['OWNER REPORT']).font = { bold: true, size: 16 };
  wsSummary.addRow([]);
  wsSummary.addRow([
    'Total Expected',
    'Total Received',
    '% Expected',
    '% Collected',
    'Outstanding',
  ]);
  wsSummary.addRow([
    totalExpected,
    totalReceived,
    completionPercent,
    percentCollected,
    totalOutstanding,
  ]);
  wsSummary.addRow([]);

  // Party Summary Table headers
  wsSummary.addRow(['Party', 'Expected Amount', 'Received Amount', '% Difference', 'Balance Due']);

  // Format headers
  const headerRow = wsSummary.getRow(6);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Add summary rows
  summaryData.forEach(row => {
    const r = wsSummary.addRow([
      row.Party,
      row['Expected Amount'],
      row['Received Amount'],
      row['% Difference'] / 100,
      row['Balance Due'],
    ]);
    r.getCell(2).numFmt = '#,##0.00';
    r.getCell(3).numFmt = '#,##0.00';
    r.getCell(4).numFmt = '0.0%';
    r.getCell(5).numFmt = '#,##0.00';
    // Conditional coloring for % Paid
    const pct = row['% Difference'] / 100;
    if (pct > 0.3)
      r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCDD2' } }; // red
    else if (pct > 0.1)
      r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9C4' } }; // yellow
    else r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } }; // green
  });

  // Auto width
  wsSummary.columns.forEach(col => {
    let maxLength = 12;
    col.eachCell({ includeEmpty: true }, cell => {
      const v = cell.value?.toString() || '';
      if (v.length > maxLength) maxLength = v.length;
    });
    col.width = maxLength + 2;
  });

  // Footer
  wsSummary.addRow([]);
  wsSummary.addRow(['For use only by Ashok Choudhary']).font = { italic: true, size: 10 };

  // --- Detailed Transactions Sheet ---
  const wsDetail = wb.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 1 }] });
  wsDetail.columns = [
    { header: 'Date', key: 'Date', width: 20 },
    { header: 'Project', key: 'Project', width: 20 },
    { header: 'Party', key: 'Party', width: 20 },
    { header: 'Flat', key: 'Flat', width: 10 },
    { header: 'Bank Amount', key: 'Bank Amount', width: 15 },
    { header: 'Cash Amount', key: 'Cash Amount', width: 15 },
    { header: 'Total Amount', key: 'Total Amount', width: 15 },
  ];

  wsDetail.addRows(detailedData);

  // Format headers
  wsDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  wsDetail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3F51B5' } };
  wsDetail.getRow(1).alignment = { horizontal: 'center' };

  // Format numeric columns
  wsDetail.columns[4].numFmt = '#,##0.00';
  wsDetail.columns[5].numFmt = '#,##0.00';
  wsDetail.columns[6].numFmt = '#,##0.00';

  // Save
  const fileName = `Owner_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer(); // generate ArrayBuffer
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Owner_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
  toast.success(`Excel report generated: ${fileName}`);
}
