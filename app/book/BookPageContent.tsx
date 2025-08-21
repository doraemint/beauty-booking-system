'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Service = { id: string; name: string; deposit: number; price: number; duration_mins: number; image_url?: string | null };

export default function BookPageContent() {
  const sp = useSearchParams();
  const [uid, setUid] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startAt, setStartAt] = useState('');
  const [ok, setOk] = useState<string>('');

  useEffect(() => {
    // Get uid from search params after component mounts
    setUid(sp.get('uid') || '');
    
    fetch('/api/services/list').then(r=>r.json()).then(setServices).catch(()=>{});
  }, [sp]);

  async function submit() {
    const res = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, service_id: serviceId, start_at: startAt, line_user_id: uid }),
    });
    const j = await res.json();
    if (res.ok) setOk(j.message || 'สร้างคำขอจองแล้ว กรุณาส่งสลิปในแชต LINE');
    else alert(j.error || 'เกิดข้อผิดพลาด');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จองคิว</h1>
      {!uid && <p className="text-sm text-red-600">ไม่พบ LINE user id (เปิดจากลิงก์ใน LINE เท่านั้น)</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(s => (
          <button key={s.id} onClick={()=>setServiceId(s.id)} className={`card text-left ${serviceId===s.id ? 'ring-2 ring-slate-900' : ''}`}>
            {s.image_url ? <img src={s.image_url} alt={s.name} className="w-full h-40 object-cover rounded-xl mb-3" /> : null}
            <div className="flex items-center justify-between">
              <div className="font-medium">{s.name}</div>
              <div className="badge">มัดจำ ฿{s.deposit}</div>
            </div>
            <div className="text-sm text-gray-500 mt-1">ราคาเต็ม ฿{s.price} • {s.duration_mins} นาที</div>
          </button>
        ))}
      </div>

      <div className="card grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="ชื่อ" onChange={e=>setName(e.target.value)} />
        <input className="border p-2 rounded" placeholder="เบอร์โทร" onChange={e=>setPhone(e.target.value)} />
        <input type="datetime-local" className="border p-2 rounded" onChange={e=>setStartAt(e.target.value)} />
        <button className="btn btn-primary" disabled={!serviceId || !startAt} onClick={submit}>ยืนยันการจอง</button>
        {ok && <p className="text-green-700">{ok}</p>}
        <p className="text-gray-500 text-sm">หลังส่งคำขอ ให้กลับไปแชต LINE แล้วส่งสลิปเป็นรูปภาพ</p>
      </div>
    </div>
  );
}