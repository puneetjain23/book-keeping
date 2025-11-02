import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { newRecord } from '../db/utils'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function PartiesPage(){
  const parties = useLiveQuery(()=> db.parties.orderBy('createdAt').reverse().toArray(), [])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [editingId, setEditingId] = useState<string|undefined>(undefined)

  const create = async () => {
    if(!name.trim()) return alert('Name required')
    if(editingId){
      await db.parties.update(editingId, { name, contact, address, modifiedAt: new Date().toISOString() })
      setEditingId(undefined)
    } else {
      const rec = newRecord({ name, contact, address })
      await db.parties.add(rec)
    }
    setName(''); setContact(''); setAddress('')
  }

  const edit = (id:string) => {
    const p = parties?.find(x=>x.id===id)
    if(!p) return
    setEditingId(id); setName(p.name); setContact(p.contact||''); setAddress(p.address||'')
  }

  const remove = async (id: string) => {
    const flatsCount = await db.flats.where('partyId').equals(id).count();
    const txCount = await db.transactions.where('partyId').equals(id).count();

    if (flatsCount > 0 || txCount > 0) {
      alert('Cannot delete party: it has dependent flats or transactions.');
      return;
    }

    if (confirm('Are you sure you want to delete this party?')) {
      await db.parties.delete(id);
    }
  };

  return (
    <section>
      <Card>
        <h3 className="font-semibold mb-2">{editingId ? 'Edit Party' : 'Create Party'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Party name" />
          <Input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact" />
          <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" />
          <div className="flex items-center">
            <Button onClick={create}>{editingId ? 'Save' : 'Create'}</Button>
            {editingId && <button className="ml-2 px-3 py-2 rounded border" onClick={()=>{ setEditingId(undefined); setName(''); setContact(''); setAddress('') }}>Cancel</button>}
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="font-semibold mb-2">Parties</h3>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead className="text-sm text-slate-500"><tr><th>#</th><th>Name</th><th>Contact</th><th>Address</th><th>Actions</th></tr></thead>
            <tbody>
              {(parties||[]).map((p,i)=>(
                <tr key={p.id} className="border-t">
                  <td className="py-2">{i+1}</td>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.contact}</td>
                  <td className="py-2">{p.address}</td>
                  <td className="py-2">
                    <button className="mr-2 text-sm" onClick={()=>edit(p.id)}>Edit</button>
                    <button className="text-sm text-red-600" onClick={()=>remove(p.id)}>Delete</button>
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
