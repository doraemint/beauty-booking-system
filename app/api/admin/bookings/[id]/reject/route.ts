import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";
import { linePush } from "@/lib/line";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({} as any));
  const reason: string | undefined = body?.reason;

  const { data: b, error: e1 } = await supabaseAdmin
    .from("bookings")
    .select("id, start_at, customers(line_user_id), services(name)")
    .eq("id", id)
    .single();
  if (e1 || !b) return NextResponse.json({ error: e1?.message || "not found" }, { status: 404 });

  const { error: e2 } = await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "rejected", status: "awaiting_deposit" })
    .eq("id", id);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const to = b.customers?.[0]?.line_user_id as string | undefined;
  if (to) {
    await linePush(to, [{ type: "text", text: `ขออภัย ไม่สามารถยืนยันมัดจำได้ ❌
${reason ? `เหตุผล: ${reason}` : ""}
โปรดส่งสลิปใหม่หรือติดต่อแอดมินค่ะ` }]);
  }

  return NextResponse.json({ ok: true });
}
