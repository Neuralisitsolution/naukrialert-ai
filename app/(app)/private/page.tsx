'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { formatIndianCurrency } from '@/lib/utils';

interface Member {
  id: string; name: string; phone: string | null;
  thisMonthCredit: number; thisMonthPaid: number; totalOutstanding: number;
}

export default function PrivateMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', email: '', password: '' });

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/private');
      if (!res.ok) throw new Error();
      setMembers(await res.json());
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success('Member added!');
      setShowModal(false);
      setForm({ name: '', phone: '', address: '', notes: '', email: '', password: '' });
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Private Members</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ Add Member</button>
      </div>

      {members.length === 0 ? (
        <EmptyState message="No private members added yet. Click Add Member to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <Link key={m.id} href={`/private/${m.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  {m.phone && <p className="text-sm text-gray-500">{m.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-red-600">This Month Credit</p>
                  <p className="text-sm font-bold text-red-700">{formatIndianCurrency(m.thisMonthCredit)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-600">This Month Paid</p>
                  <p className="text-sm font-bold text-green-700">{formatIndianCurrency(m.thisMonthPaid)}</p>
                </div>
                <div className={`rounded-lg p-2 ${m.totalOutstanding > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className={`text-xs ${m.totalOutstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>Outstanding</p>
                  <p className={`text-sm font-bold ${m.totalOutstanding > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatIndianCurrency(m.totalOutstanding)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Private Member">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Member name" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Optional" />
          </div>
          <div>
            <label className="label">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="Optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Optional" />
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-3">Login credentials - these let the member sign in to submit payments</p>
            <div>
              <label className="label">Login Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="member@example.com" />
            </div>
            <div className="mt-3">
              <label className="label">Login Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min 6 characters" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Add Member'}</button>
        </form>
      </Modal>
    </div>
  );
}
