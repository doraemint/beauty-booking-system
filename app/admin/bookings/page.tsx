'use client';
import { useEffect, useMemo, useState } from 'react';

type Row = {
  id: string;
  start_at: string;
  deposit_amount: number;
  payment_status: string;
  status: string;
  payment_slip_url?: string | null;
  customers?: { name?: string | null; phone?: string | null; line_user_id?: string | null } | null;
  services?: { name?: string | null } | null;
};

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const initialToken = useMemo(() => (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('token') || '') : ''), []);

  useEffect(() => { setToken(initialToken); }, [initialToken]);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/bookings/list?status=awaiting_deposit', {
      headers: token ? { 'x-admin-token': token } : undefined,
      cache: 'no-store',
    });
    if (res.ok) {
      const j = await res.json();
      setRows(j);
    } else {
      alert('โหลดข้อมูลไม่สำเร็จ (token อาจไม่ถูกต้อง)');
    }
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function approve(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}/approve`, { method: 'POST', headers: token ? { 'x-admin-token': token } : undefined });
    if (res.ok) load(); else alert('อนุมัติไม่สำเร็จ');
  }
  async function reject(id: string) {
    const reason = prompt('เหตุผลที่ไม่อนุมัติ (ไม่บังคับ)') || '';
    const res = await fetch(`/api/admin/bookings/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) load(); else alert('ไม่อนุมัติไม่สำเร็จ');
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">รอการยืนยันมัดจำ</h1>

      <div className="flex items-center gap-2">
        <input className="border p-2 rounded w-[360px]" placeholder="Admin token" value={token} onChange={(e)=>setToken(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>โหลดข้อมูล</button>
        {token && <a className="btn btn-ghost" href={`/api/admin/reports/daily?date=${new Date().toISOString().slice(0,10)}&format=csv`} target="_blank">ดาวน์โหลดรายงานวันนี้ (CSV)</a>}
      </div>

      <div className="overflow-x-auto card">
        <table className="table">
          <thead>
            <tr>
              <th>ลูกค้า</th>
              <th>บริการ / นัดหมาย</th>
              <th>มัดจำ</th>
              <th>สลิป</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-6" colSpan={5}>กำลังโหลด…</td></tr>}
            {!loading && rows.length === 0 && <tr><td className="p-6 text-center text-gray-500" colSpan={5}>ไม่มีรายการ</td></tr>}
            {!loading && rows.map(b => (
              <tr key={b.id}>
                <td>
                  {b.customers?.name || '(ไม่มีชื่อ)'}<div className="text-gray-500">{b.customers?.phone || ''}</div>
                </td>
                <td>
                  {b.services?.name || '-'}<div className="text-gray-500">{new Date(b.start_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</div>
                </td>
                <td>฿{b.deposit_amount}</td>
                <td>{b.payment_slip_url ? <a className="underline" href={b.payment_slip_url} target="_blank">ดูสลิป</a> : <span className="text-gray-400">—</span>}</td>
                <td className="space-x-2">
                  <a className="btn btn-ghost" href={`/admin/bookings/${b.id}/receipt?token=${encodeURIComponent(token)}`} target="_blank">ใบรับมัดจำ</a>
                  <button className="btn btn-primary" onClick={()=>approve(b.id)}>อนุมัติ</button>
                  <button className="btn btn-ghost" onClick={()=>reject(b.id)}>ไม่อนุมัติ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
