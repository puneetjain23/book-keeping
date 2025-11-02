import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { exportAllToExcel } from '../db/excelUtils'

export default function ReportsPage(){
  const projects = useLiveQuery(()=> db.projects.toArray(), [])
  const parties = useLiveQuery(()=> db.parties.toArray(), [])
  const flats = useLiveQuery(()=>db.flats.toArray(), [])
  const [projectId, setProjectId] = useState<string|undefined>(undefined)
  const [partyId, setPartyId] = useState<string|undefined>(undefined)
  const transactions = useLiveQuery(()=> db.transactions.orderBy('createdAt').reverse().toArray(), [])

  const filtered = (transactions||[]).filter(t=> {
    if(projectId && t.projectId !== projectId) return false
    if(partyId && t.partyId !== partyId) return false
    return true
  })

  return (
    <section>
      <Card>
        <h3 className="font-semibold mb-2">Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={projectId} onChange={e=>setProjectId(e.target.value)}>
            <option value="">-- Project --</option>
            {(projects||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={partyId} onChange={e=>setPartyId(e.target.value)}>
            <option value="">-- Party --</option>
            {(parties||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <Button onClick={()=>exportAllToExcel()}>Export All</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h4 className="font-semibold mb-2">Transactions</h4>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead className="text-sm text-slate-500"><tr><th>#</th><th>Date</th><th>Project</th><th>Party</th><th>Flat</th><th>Total</th></tr></thead>
            <tbody>
              {filtered.map((t,i)=>(
                <tr key={t.id} className="border-t">
                  <td className="py-2">{i+1}</td>
                  <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="py-2">{projects?.find(p=>p.id===t.projectId)?.name || t.projectId}</td>
                  <td className="py-2">{parties?.find(p=>p.id===t.partyId)?.name || t.partyId || '-'}</td>
                  <td className="py-2">{flats?.find(f => f.id === t.flatId)?.flatNo || '-'}</td>
                  <td className="py-2">{t.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}
