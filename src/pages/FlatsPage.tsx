import React, { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { newRecord } from '../db/utils'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { toast } from 'react-toastify';

export default function FlatsPage(){
  const projects = useLiveQuery(()=> db.projects.toArray(), [])
  const parties = useLiveQuery(()=> db.parties.toArray(), [])
  const flats = useLiveQuery(()=> db.flats.orderBy('createdAt').reverse().toArray(), [])
  const [projectId, setProjectId] = useState<string|undefined>(undefined)
  const [partyId, setPartyId] = useState<string|undefined>(undefined)
  const [flatNo, setFlatNo] = useState('')
  const [area, setArea] = useState('')
  const [rate, setRate] = useState('')
  const [editingId, setEditingId] = useState<string|undefined>(undefined)

  useEffect(()=>{ if(projects && projects.length && !projectId) setProjectId(projects[0].id); }, [projects])

  const create = async () => {
    if(!projectId) return toast.error('Project required')
    if(!flatNo.trim()) return toast.error('Flat no required')
    const amount = Number(area||0) * Number(rate||0)
    if(editingId){
      await db.flats.update(editingId, { projectId, partyId, flatNo, areaSqft: area, ratePerSqft: rate, amount, modifiedAt: new Date().toISOString() })
      setEditingId(undefined)
    } else {
      const rec = newRecord({ projectId, partyId, flatNo, areaSqft: area, ratePerSqft: rate, amount })
      await db.flats.add(rec)
    }
    setFlatNo(''); setArea(0); setRate(0); setPartyId(undefined)
  }

  const edit = (id:string) => {
    const f = flats?.find(x=>x.id===id)
    if(!f) return
    setEditingId(id)
    setProjectId(f.projectId)
    setPartyId(f.partyId)
    setFlatNo(f.flatNo)
    setArea(f.areaSqft)
    setRate(f.ratePerSqft)
  }

  const remove = async (id: string) => {
    const txCount = await db.transactions.where('flatId').equals(id).count();

    if (txCount > 0) {
      toast.error('Cannot delete flat: it has dependent transactions.');
      return;
    }

    if (confirm('Are you sure you want to delete this flat?')) {
      await db.flats.delete(id);
    }
  };

  return (
    <section>
      <Card>
        <h3 className="font-semibold mb-2">{editingId ? 'Edit Flat' : 'Create Flat'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={projectId} onChange={e=>setProjectId(e.target.value)}>
            <option value="">-- Select Project --</option>
            {(projects||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={partyId} onChange={e=>setPartyId(e.target.value)}>
            <option value="">-- Select Party (optional) --</option>
            {(parties||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input value={flatNo} onChange={e=>setFlatNo(e.target.value)} placeholder="Flat no" />
          <Input value={area} onChange={e=>setArea(Number(e.target.value))} placeholder="Area (sqft)" />
          <Input value={rate} onChange={e=>setRate(Number(e.target.value))} placeholder="Rate per sqft" />
          <div className="flex items-center">
            <div className="mr-2">Amount: <strong>{Number(area||0)*Number(rate||0)}</strong></div>
            <Button onClick={create}>{editingId ? 'Save' : 'Create'}</Button>
            {editingId && <button className="ml-2 px-3 py-2 rounded border" onClick={()=>{ setEditingId(undefined); setFlatNo(''); setArea(0); setRate(0); setPartyId(undefined) }}>Cancel</button>}
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="font-semibold mb-2">Flats</h3>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead className="text-sm text-slate-500"><tr><th>#</th><th>Project</th><th>Flat</th><th>Party</th><th>Area</th><th>Rate</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {(flats||[]).map((f,i)=>(
                <tr key={f.id} className="border-t">
                  <td className="py-2">{i+1}</td>
                  <td className="py-2">{projects?.find(p=>p.id===f.projectId)?.name || f.projectId}</td>
                  <td className="py-2">{f.flatNo}</td>
                  <td className="py-2">{parties?.find(p=>p.id===f.partyId)?.name || f.partyId || '-'}</td>
                  <td className="py-2">{f.areaSqft}</td>
                  <td className="py-2">{f.ratePerSqft}</td>
                  <td className="py-2">{f.amount}</td>
                  <td className="py-2">
                    <button className="mr-2 text-sm" onClick={()=>edit(f.id)}>Edit</button>
                    <button className="text-sm text-red-600" onClick={()=>remove(f.id)}>Delete</button>
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
