import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";
import { linePush } from "@/lib/line";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  // Fetch booking with customer and service info
  const { data: b, error: e1 } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id, 
      start_at, 
      deposit_amount, 
      customers(line_user_id), 
      services(name)
    `
    )
    .eq("id", id)
    .single();

  if (e1 || !b)
    return NextResponse.json(
      { error: e1?.message || "not found" },
      { status: 404 }
    );

  // Update booking status to confirmed
  const { error: e2 } = await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", id);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // Send LINE notification to customer
  const to = b.customers?.line_user_id as string | undefined;
  if (to) {
    const timeTxt = new Date(b.start_at).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });
    await linePush(to, [
      {
        type: "text",
        text: `ยืนยันมัดจำสำเร็จ ✅
บริการ: ${b.services?.name ?? ""}
นัด: ${timeTxt}`,
      },
    ]);
  }

  return NextResponse.json({ ok: true });
}
