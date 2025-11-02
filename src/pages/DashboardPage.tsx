import React, { useState } from 'react';
import { exportAllToExcel, importFromExcel, clearAllData } from '../db/excelUtils';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateExcelReport } from '../db/excelReport';

export default function DashboardPage() {
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const [completion, setCompletion] = useState<number>(100);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedParty, setSelectedParty] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (projects && projects.length && !selectedProject) setSelectedProject(projects[0].id);
  }, [projects]);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await importFromExcel(f);
    alert('Import finished');
    e.currentTarget.value = '';
  };

  const computeGrid = async () => {
    const allParties = await db.parties.toArray(); // add this
    if (!selectedProject) return [];
    const flats = await db.flats.where('projectId').equals(selectedProject).toArray();
    const txs = await db.transactions.where('projectId').equals(selectedProject).toArray();
    // group by party
    const partiesMap = new Map();
    for (const p of flats) {
      const pid = p.partyId || 'UNASSIGNED';
      const prev = partiesMap.get(pid) || { expected: 0, received: 0, partyId: pid };
      prev.expected += (p.amount || 0) * (completion/100);
      partiesMap.set(pid, prev);
    }
    for (const t of txs) {
      const pid = t.partyId || 'UNASSIGNED';
      const prev = partiesMap.get(pid) || { expected: 0, received: 0, partyId: pid };
      prev.received += t.totalAmount || 0;
      partiesMap.set(pid, prev);
    }
    const arr = Array.from(partiesMap.values()).map((it:any, idx:number)=> {
      const party = allParties.find(p => p.id === it.partyId);
      const percent = (100 - (it.expected === 0 ? 0 : Math.round((it.received / it.expected)*100)));
      return { sNo: idx+1, partyId: it.partyId, partyName: party?.name || 'Unknown Party', received: it.received, expected: it.expected, percent };
    });
    const filtered = selectedParty
                      ? arr.filter(a => a.partyId === selectedParty)
                      : arr;
    filtered.sort((a,b)=> b.percent - a.percent);
    return filtered;
  };

  const [grid, setGrid] = React.useState<any[]>([]);
  const refresh = async () => {
    const g = await computeGrid();
    setGrid(g);
  };

  React.useEffect(()=>{ refresh(); }, [selectedProject, completion]);

  return (
    <section className="space-y-4">

      <div className="bg-white/90 p-4 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="input p-2 rounded">
          <option value="">-- Select Project --</option>
          {(projects||[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input p-2 rounded" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}>
          <option value="">-- Party (optional) --</option>
          {(parties||[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm">Completion %</label>
          <input type="number" value={completion} onChange={e=>setCompletion(Number(e.target.value||0))} className="input p-2 rounded w-28" />
          <button onClick={refresh} className="px-3 py-2 rounded-xl bg-slate-700 text-white">Apply</button>
        </div>
      </div>

      <div className="bg-white/90 p-4 rounded-2xl shadow-lg overflow-x-auto">
        <h3 className="font-semibold text-lg sm:text-xl mb-2">Overview</h3>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500">
                <th>#</th><th>Party</th><th>Received</th><th>Expected</th><th>Difference (%)</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">{r.sNo}</td>
                  <td className="px-2 py-1">{r.partyName}</td>
                  <td className="px-2 py-1">{r.received}</td>
                  <td className="px-2 py-1">{r.expected}</td>
                  <td className="px-2 py-1">{r.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/90 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="text-sm">Import (xlsx)</label>
          <input type="file"  className="input p-2 rounded w-full sm:w-auto" accept=".xlsx,.xls" onChange={onImport} />
          <button onClick={() => exportAllToExcel()} className="px-3 py-2 rounded-xl bg-indigo-600 text-white w-full sm:w-auto">Export</button>
          <button onClick={async ()=>{ if(confirm('Clear all local DB?')) { await clearAllData(); alert('Cleared'); refresh(); } }} className="px-3 py-2 rounded-xl bg-red-600 text-white w-full sm:w-auto">Clear all</button>
          <button className="px-3 py-2 rounded-xl bg-red-600 text-white w-full sm:w-auto"
            onClick={() =>
              generateExcelReport({
                projectId: selectedProject,
                partyId: selectedParty,
                completionPercent: completion
              })
            }
          >
            Generate Report
          </button>    
        </div>
      </div>

    </section>
  )
}
