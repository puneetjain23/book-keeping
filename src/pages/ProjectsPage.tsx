import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { newRecord } from '../db/utils';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';

export default function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray(), []);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const create = async () => {
    if (!name.trim()) return toast.error('Name required');
    if (editingId) {
      await db.projects.update(editingId, { name, notes, modifiedAt: new Date().toISOString() });
      setEditingId(undefined);
    } else {
      const rec = newRecord({ name, notes });
      await db.projects.add(rec);
    }
    setName('');
    setNotes('');
  };

  const edit = (id: string) => {
    const p = projects?.find(x => x.id === id);
    if (!p) return;
    setEditingId(id);
    setName(p.name);
    setNotes(p.notes || '');
  };

  const remove = async (id: string) => {
    const flatsCount = await db.flats.where('projectId').equals(id).count();
    const txCount = await db.transactions.where('projectId').equals(id).count();

    if (flatsCount > 0 || txCount > 0) {
      toast.error('Cannot delete project: it has dependent flats or transactions.');
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) return;
    await db.projects.delete(id);
  };

  return (
    <section>
      <Card>
        <h3 className="font-semibold mb-2">{editingId ? 'Edit Project' : 'Create Project'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" />
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />
          <div className="flex items-center">
            <Button onClick={create}>{editingId ? 'Save' : 'Create'}</Button>
            {editingId && (
              <button
                className="ml-2 px-3 py-2 rounded border"
                onClick={() => {
                  setEditingId(undefined);
                  setName('');
                  setNotes('');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="font-semibold mb-2">Projects</h3>
        <div className="overflow-x-auto">
          <table className="table-fixed min-w-[600px] w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Notes</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(projects || []).map((p, i) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.notes}</td>
                  <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="py-2">
                    <button className="mr-2 text-sm" onClick={() => edit(p.id)}>
                      Edit
                    </button>
                    <button className="text-sm text-red-600" onClick={() => remove(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
