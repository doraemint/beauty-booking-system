'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Service = { id: string; name: string; deposit: number; price: number; duration_mins: number; image_url?: string | null };

declare global {
  interface Window {
    liff: any;
  }
}

export default function BookPageContent() {
  const sp = useSearchParams();
  const [uid, setUid] = useState<string>('');
  const [liffState, setLiffState] = useState<'idle' | 'init' | 'success' | 'error'>('idle');
  const [liffError, setLiffError] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startAt, setStartAt] = useState('');
  const [ok, setOk] = useState<string>('');

  useEffect(() => {
    // Check if uid is in URL (from LINE link)
    const urlUid = sp.get('uid') || '';
    if (urlUid) {
      setUid(urlUid);
      return;
    }

    // Check if we have uid in localStorage (from previous LIFF session)
    const storedUid = localStorage.getItem('lineUserId');
    if (storedUid) {
      setUid(storedUid);
      return;
    }

    // Initialize LIFF
    initializeLiff();

    // Fetch services
    fetch('/api/services/list').then(r=>r.json()).then(setServices).catch(()=>{});
  }, [sp]);

  const initializeLiff = async () => {
    try {
      setLiffState('init');
      
      // Dynamically load LIFF script
      if (!window.liff) {
        await loadLiffScript();
      }

      // Initialize LIFF with your LIFF ID
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        throw new Error('LIFF ID not configured');
      }

      await window.liff.init({ liffId });
      
      if (window.liff.isLoggedIn()) {
        // Get user profile
        const profile = await window.liff.getProfile();
        const userId = profile.userId;
        setUid(userId);
        localStorage.setItem('lineUserId', userId);
        setLiffState('success');
      } else {
        // Not logged in - show login button
        setLiffState('idle');
      }
    } catch (error: any) {
      console.error('LIFF Error:', error);
      setLiffError(error.message || 'Failed to initialize LIFF');
      setLiffState('error');
    }
  };

  const loadLiffScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/1.0/sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load LIFF script'));
      document.body.appendChild(script);
    });
  };

  const handleLineLogin = async () => {
    try {
      setLiffState('init');
      
      if (!window.liff) {
        await loadLiffScript();
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID not configured');
        }
        await window.liff.init({ liffId });
      }

      if (!window.liff.isLoggedIn()) {
        // Login with LINE
        await window.liff.login();
      }

      // Get user profile
      const profile = await window.liff.getProfile();
      const userId = profile.userId;
      setUid(userId);
      localStorage.setItem('lineUserId', userId);
      setLiffState('success');
    } catch (error: any) {
      console.error('LIFF Login Error:', error);
      setLiffError(error.message || 'Failed to login with LINE');
      setLiffState('error');
    }
  };

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

  // If we have uid, show booking form
  if (uid) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">จองคิว</h1>
        <div className="text-sm text-green-600">
          เชื่อมต่อกับ LINE แล้ว (UID: {uid.substring(0, 10)}...)
        </div>

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

  // If no uid, show LINE Login with LIFF
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จองคิว</h1>
      
      <div className="card max-w-md space-y-4">
        <p className="text-gray-600">
          โปรดเชื่อมต่อกับบัญชี LINE ของคุณเพื่อเริ่มจองคิว
        </p>
        
        {liffState === 'init' ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="loading loading-spinner loading-sm"></span>
            <span>กำลังเชื่อมต่อ LINE...</span>
          </div>
        ) : liffState === 'error' ? (
          <div className="space-y-3">
            <div className="text-red-600 text-sm">
              {liffError}
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleLineLogin}
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={handleLineLogin}
          >
            <span>เข้าสู่ระบบด้วย LINE</span>
          </button>
        )}
        
        <p className="text-sm text-gray-500">
          คุณยังสามารถเข้าถึงหน้านี้ผ่านลิงก์ในแชท LINE ได้โดยการพิมพ์ "จองคิว"
        </p>
      </div>
    </div>
  );
}
