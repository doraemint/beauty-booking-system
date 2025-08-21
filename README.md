# Booking SaaS — Complete MVP (Next.js + Supabase + LINE OA)

ฟีเจอร์หลัก
- หน้า **/book** (ลูกค้า) — เลือกบริการแบบการ์ด (มีรูป), กรอกข้อมูล, กันคิวชนด้วยการเช็คช่วงเวลา
- **API**: `/api/bookings/create` (กันชน), `/api/services/list`
- **LINE Webhook** `/api/line/webhook` — ตอบ "จองคิว", รับรูปสลิป, อัปโหลด Storage, แนบกับ booking ล่าสุด
- **Admin** `/admin/bookings` — รายการรอยืนยัน + ปุ่มอนุมัติ/ไม่อนุมัติ + ลิงก์ **ใบรับมัดจำ** แบบพิมพ์ได้
- **รายงานรายวัน (CSV)** `/api/admin/reports/daily?date=YYYY-MM-DD&format=csv`
- **Storage**: บัคเก็ต `payment-slips`
- **Edge Function**: `send-reminders` สำหรับแจ้งเตือนนัดพรุ่งนี้ (09:00 Asia/Bangkok)

## ติดตั้ง
1) สร้างโปรเจกต์ Supabase → เปิด SQL Editor → รัน `db/schema.sql`
   ```sql
   select storage.create_bucket('payment-slips', public => false);
   ```
2) คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าให้ครบ

3) ติดตั้งและรัน
```bash
npm i
npm run dev
```

4) ตั้งค่า LINE OA (Messaging API)
- ใช้ webhook URL: `https://<โดเมนหรือ ngrok>/api/line/webhook`
- ปิด Auto-reply & Greeting ชั่วคราว

5) เปิดหน้าแอดมิน: `/admin/bookings?token=<ADMIN_TOKEN>`

## หมายเหตุ
- ใช้ **ADMIN_TOKEN** แบบง่ายสำหรับ MVP; โปรดแทนที่ด้วย NextAuth/Supabase Auth + RLS ในโปรดักชัน
- กันคิวชน: ฝั่งฐานข้อมูลมี unique index ป้องกัน start_at ซ้ำ และฝั่ง API เช็คช่วงเวลาตาม `duration_mins`

โชคดีในการเดโมและขายค่ะ/ครับ 🚀
