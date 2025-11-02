import React, { useEffect, useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { newRecord } from '../db/utils';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export default function TransactionsPage() {
  const projects = useLiveQuery(()=> db.projects.toArray(), []);
  const parties = useLiveQuery(()=> db.parties.toArray(), []);
  const [projectId, setProjectId] = useState<string|undefined>(undefined);
  const [partyId, setPartyId] = useState<string|undefined>(undefined);
  const [flatId, setFlatId] = useState<string|undefined>(undefined);
  const [bankAmount, setBankAmount] = useState<any>('');
  const [cashAmount, setCashAmount] = useState<any>('');
  const [editingId, setEditingId] = useState<string|undefined>(undefined);

  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [selectedParty, setSelectedParty] = useState<string | undefined>();
  const [selectedFlat, setSelectedFlat] = useState<string | undefined>();
  const [transactionDate, setTransactionDate] = useState<Date | undefined>();
  const flats = useLiveQuery(()=> projectId ? db.flats.where('projectId').equals(projectId).toArray() : db.flats.toArray(), [projectId]);
  const transactions = useLiveQuery(()=> db.transactions.orderBy('createdAt').reverse().toArray(), []);
  const flatsDropdown = useLiveQuery(() => {
    let query = db.flats.toCollection();

    if (selectedProject) query = query.filter(f => f.projectId === selectedProject);
    if (selectedParty) query = query.filter(f => f.partyId === selectedParty);

    return query.toArray();
  }, [selectedProject, selectedParty]);
  useEffect(()=>{ if(projects && projects.length && !projectId) setProjectId(projects[0].id); }, [projects]);

  const reset = ()=>{ setBankAmount(0); setCashAmount(0); setFlatId(undefined); setPartyId(undefined); setEditingId(undefined); }

  const onCreate = async () => {
    if (!projectId || !partyId || !flatId || !bankAmount || !cashAmount || !transactionDate) {
      alert('Please fill in all fields before creating the transaction.');
      return;
    }
    const total = Number(bankAmount||0)+Number(cashAmount||0);
    if(editingId){
      await db.transactions.update(editingId, { projectId, partyId, flatId, bankAmount, cashAmount, transactionDate, totalAmount: total, modifiedAt: new Date().toISOString() })
      reset();
    } else {
      const rec:any = newRecord({ projectId, partyId, flatId, bankAmount, cashAmount, transactionDate, totalAmount: total, mode: 'receipt' });
      await db.transactions.add(rec);
      reset();
    }
  };

  const onEdit = (id:string)=> {
    const t = transactions?.find(x=>x.id===id);
    if(!t) return;
    setEditingId(id);
    setProjectId(t.projectId);
    setPartyId(t.partyId);
    setFlatId(t.flatId);
    setBankAmount(t.bankAmount);
    setCashAmount(t.cashAmount);
  }

  const onDelete = async (id:string) => {
    if(!confirm('Delete transaction?')) return;
    await db.transactions.delete(id);
  }

  return (
    <section id="transactions" className="space-y-4">
      <Card>
        <h3 className="font-semibold mb-2">{editingId ? 'Edit Transaction' : 'Create Transaction'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={projectId} onChange={e=>{setProjectId(e.target.value); setSelectedProject(e.target.value); setSelectedFlat(undefined);}}>
            <option value="">-- Project --</option>
            {(projects||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={partyId} onChange={e=>{setPartyId(e.target.value); setSelectedParty(e.target.value); setSelectedFlat(undefined);}}>
            <option value="">-- Party --</option>
            {(parties||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={flatId} onChange={e=>{ setFlatId(e.target.value); setSelectedFlat(e.target.value)}}>
            <option value="">-- Flat --</option>
            {(flatsDropdown||[]).map(f=> <option key={f.id} value={f.id}>{f.flatNo}</option>)}
          </Select>
          <Input
            type="date"
            value={transactionDate ? transactionDate.toISOString().slice(0, 10) : ''}
            onChange={e => setTransactionDate(new Date(e.target.value))}
            placeholder="Transaction Date"
          />
          <Input value={bankAmount} onChange={e=>setBankAmount((e.target.value))} placeholder="Bank" />
          <Input value={cashAmount} onChange={e=>setCashAmount((e.target.value))} placeholder="Cash" />
        </div>
        <div className="mt-3 text-right">
          <Button onClick={onCreate}>{editingId ? 'Save' : 'Create'}</Button>
          {editingId && <button className="ml-2 px-3 py-2 rounded border" onClick={reset}>Cancel</button>}
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="font-semibold mb-2">Transactions</h3>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Bank</th>
                <th className="px-3 py-2">Cash</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(transactions||[]).map((t,i) => (
                <tr key={t.id} className="border-t text-sm">
                  <td className="px-3 py-2">{i+1}</td>
                  <td className="px-3 py-2">{t.transactionDate ? t.transactionDate.toISOString().slice(0,10) : ''}</td>
                  <td className="px-3 py-2">{projects?.find(p => p.id===t.projectId)?.name || t.projectId}</td>
                  <td className="px-3 py-2">{parties?.find(p => p.id===t.partyId)?.name || t.partyId || '-'}</td>
                  <td className="px-3 py-2">{flats?.find(f => f.id===t.flatId)?.flatNo || t.flatId || '-'}</td>
                  <td className="px-3 py-2">{t.bankAmount}</td>
                  <td className="px-3 py-2">{t.cashAmount}</td>
                  <td className="px-3 py-2">{t.totalAmount}</td>
                  <td className="px-3 py-2">
                    <button className="mr-2 text-sm" onClick={() => onEdit(t.id)}>Edit</button>
                    <button className="text-sm text-red-600" onClick={() => onDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}
