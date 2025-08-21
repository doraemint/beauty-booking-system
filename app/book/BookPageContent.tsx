"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import liff from "@line/liff";

type Service = {
  id: string;
  name: string;
  deposit: number;
  price: number;
  duration_mins: number;
  image_url?: string | null;
};

export default function BookPage() {
  const sp = useSearchParams();

  // ถ้ามี ?uid= ใน URL ใช้ก่อน (รองรับกรณีเปิดจากลิงก์ webhook เดิม)
  const [uid, setUid] = useState<string>(sp.get("uid") || "");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startAt, setStartAt] = useState("");
  const [ok, setOk] = useState("");

  // โหลดบริการ
  useEffect(() => {
    fetch("/api/services/list")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  // ถ้าไม่มี uid ให้ลองดึงจาก LIFF (เปิดจาก Rich Menu หรือปุ่มลิงก์ LIFF)
  useEffect(() => {
    if (uid) return; // มี uid แล้วไม่ต้อง init LIFF

    (async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID as string | undefined;
        if (!liffId) return; // ยังไม่ได้ตั้งค่า LIFF → ปล่อยให้เตือน "กำลังยืนยัน..."

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // ให้ผู้ใช้ login ผ่าน LINE แล้วกลับมาหน้าเดิม
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // 1) พยายามอ่าน Messaging userId (ถ้าเปิด LIFF จากห้องแชต OA)
        const ctx: any = (liff as any).getContext?.();
        if (ctx?.userId) {
          setUid(ctx.userId);
          return;
        }

        // 2) ลองอ่านจาก ID Token (LINE Login user id = claim 'sub')
        const idToken = liff.getIDToken();
        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          if (payload?.sub) {
            setUid(payload.sub);
            return;
          }
        }

        // 3) Fallback: โปรไฟล์
        const profile = await liff.getProfile();
        if (profile?.userId) setUid(profile.userId);
      } catch (e) {
        console.error("LIFF init error", e);
      }
    })();
  }, [uid]);

  async function submit() {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        service_id: serviceId,
        start_at: startAt,
        line_user_id: uid,
      }),
    });
    const j = await res.json();
    if (res.ok) setOk(j.message || "สร้างคำขอจองแล้ว กรุณาส่งสลิปในแชต LINE");
    else alert(j.error || "เกิดข้อผิดพลาด");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จองคิว</h1>
      {!uid && (
        <p className="text-sm text-orange-700">
          กำลังยืนยันตัวตนผ่าน LINE… ถ้าหน้านี้วนลูป ให้เปิดลิงก์นี้ “ภายใน
          LINE” อีกครั้ง
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => setServiceId(s.id)}
            className={`card text-left ${
              serviceId === s.id ? "ring-2 ring-slate-900" : ""
            }`}
          >
            {s.image_url ? (
              <img
                src={s.image_url}
                alt={s.name}
                className="w-full h-40 object-cover rounded-xl mb-3"
              />
            ) : null}
            <div className="flex items-center justify-between">
              <div className="font-medium">{s.name}</div>
              <div className="badge">มัดจำ ฿{s.deposit}</div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ราคาเต็ม ฿{s.price} • {s.duration_mins} นาที
            </div>
          </button>
        ))}
      </div>

      <div className="card grid gap-3 max-w-md">
        <input
          className="border p-2 rounded"
          placeholder="ชื่อ"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="เบอร์โทร"
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="datetime-local"
          className="border p-2 rounded"
          onChange={(e) => setStartAt(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={!serviceId || !startAt || !uid}
          onClick={submit}
        >
          ยืนยันการจอง
        </button>
        {ok && <p className="text-green-700">{ok}</p>}
        <p className="text-gray-500 text-sm">
          หลังส่งคำขอ ให้กลับไปแชต LINE แล้วส่งสลิปเป็นรูปภาพ
        </p>
      </div>
    </div>
  );
}
