import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyLineSignature, lineReply, linePush } from "@/lib/line";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // อ่าน raw body ก่อนเพื่อตรวจลายเซ็น
  const raw = await req.text();
  const ok = verifyLineSignature(raw, req.headers.get("x-line-signature"));
  if (!ok)
    return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const body = JSON.parse(raw);
  for (const ev of body.events || []) {
    const userId: string | undefined = ev?.source?.userId;
    if (!userId) continue;

    // --- กรณีข้อความ ---
    if (ev.type === "message" && ev.message?.type === "text") {
      const text = String(ev.message.text || "").trim();

      // ถ้าผู้ใช้พิมพ์ "จองคิว" ให้ตอบลิงก์ LIFF (ถ้าตั้งไว้) หรือ /book
      if (/^จองคิว$/i.test(text)) {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        const url = liffId
          ? `https://liff.line.me/${liffId}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/book?uid=${encodeURIComponent(
              userId
            )}`;

        await lineReply(ev.replyToken, [
          { type: "text", text: "เริ่มจองคิวได้เลยค่ะ👇" },
          { type: "text", text: url },
        ]);
      }
    }

    // --- กรณีรูปสลิป ---
    if (ev.type === "message" && ev.message?.type === "image") {
      // 1) ดาวน์โหลดรูปจาก LINE
      const imgRes = await fetch(
        `https://api-data.line.me/v2/bot/message/${ev.message.id}/content`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN!}`,
          },
        }
      );
      const buf = await imgRes.arrayBuffer();

      // 2) อัปโหลดขึ้น Supabase Storage
      const path = `default/${userId}/${Date.now()}.jpg`;
      const up = await supabaseAdmin.storage
        .from("payment-slips")
        .upload(path, buf, { contentType: "image/jpeg" });

      if (up.error) {
        await linePush(userId, [
          { type: "text", text: "อัปโหลดสลิปล้มเหลว ลองใหม่อีกครั้งค่ะ" },
        ]);
        continue;
      }

      const { data: signed } = await supabaseAdmin.storage
        .from("payment-slips")
        .createSignedUrl(path, 60 * 60 * 24 * 30);

      // 3) แนบกับ booking ล่าสุดที่ยังรอมัดจำของลูกค้าคนนี้
      const { data: cust } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("line_user_id", userId)
        .maybeSingle();

      if (cust?.id) {
        const { data: b } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("customer_id", cust.id)
          .eq("status", "awaiting_deposit")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (b?.id) {
          await supabaseAdmin
            .from("bookings")
            .update({ payment_slip_url: signed?.signedUrl || null })
            .eq("id", b.id);

          await linePush(userId, [
            {
              type: "text",
              text: "รับสลิปเรียบร้อยค่ะ ✅ แอดมินจะตรวจสอบให้เร็วที่สุด",
            },
          ]);
        } else {
          await linePush(userId, [
            {
              type: "text",
              text: 'ไม่พบคำขอจองที่รอยืนยัน หากสงสัยพิมพ์ "จองคิว" ได้เลยค่ะ',
            },
          ]);
        }
      } else {
        await linePush(userId, [
          {
            type: "text",
            text: "ยังไม่พบข้อมูลลูกค้า กรุณากดลิงก์จองใหม่อีกครั้งค่ะ",
          },
        ]);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
