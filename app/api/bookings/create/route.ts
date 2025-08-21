import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });
  const { name, phone, service_id, start_at, line_user_id } = body;
  if (!service_id || !start_at || !line_user_id) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // upsert customer by line_user_id
  const { data: cust, error: eCust } = await supabaseAdmin
    .from("customers")
    .upsert({ line_user_id, name, phone }, { onConflict: "line_user_id" })
    .select("id")
    .single();
  if (eCust) return NextResponse.json({ error: eCust.message }, { status: 500 });

  // fetch service to get deposit & duration
  const { data: svc, error: e1 } = await supabaseAdmin
    .from("services")
    .select("id, deposit, duration_mins")
    .eq("id", service_id)
    .single();
  if (e1 || !svc) return NextResponse.json({ error: "invalid service" }, { status: 400 });

  const start = new Date(start_at);
  const duration = svc.duration_mins || 0;
  const before = new Date(start.getTime() - duration * 60 * 1000);
  const after = new Date(start.getTime() + duration * 60 * 1000);

  // collision check: any booking within [before, after) for same service and status active
  const { data: collide, error: e2 } = await supabaseAdmin
    .from("bookings")
    .select("id, start_at, status")
    .eq("service_id", service_id)
    .in("status", ["awaiting_deposit", "confirmed"])
    .gte("start_at", before.toISOString())
    .lt("start_at", after.toISOString());
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  if (collide && collide.length > 0) {
    return NextResponse.json({ error: "ช่วงเวลานี้ไม่ว่าง กรุณาเลือกเวลาอื่น" }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from("bookings").insert({
    customer_id: cust!.id,
    service_id,
    start_at: start.toISOString(),
    deposit_amount: svc.deposit,
    status: "awaiting_deposit",
    payment_status: "unpaid",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "สร้างคำขอจองแล้ว กรุณาส่งสลิปในแชต LINE" });
}
