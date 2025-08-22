import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });
  const { name, phone, service_id, start_at, line_user_id, payment_method = "bank_transfer" } = body;
  if (!service_id || !start_at || !line_user_id) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // Check if customer already exists, if not create new customer record
  let customerId;
  const { data: existingCustomer, error: selectError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("line_user_id", line_user_id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existingCustomer) {
    // Update existing customer with new name and phone
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from("customers")
      .update({ name, phone })
      .eq("line_user_id", line_user_id)
      .select("id")
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    customerId = updatedCustomer.id;
  } else {
    // Insert new customer record
    const { data: newCustomer, error: insertError } = await supabaseAdmin
      .from("customers")
      .insert({ line_user_id, name, phone })
      .select("id")
      .single();
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    customerId = newCustomer.id;
  }

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

  // Create the booking
  const { data: bookingData, error: bookingError } = await supabaseAdmin.from("bookings").insert({
    customer_id: customerId,
    service_id,
    start_at: start.toISOString(),
    deposit_amount: svc.deposit,
    status: "awaiting_deposit",
    payment_status: "unpaid",
    payment_method,
  }).select().single();
  
  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });

  const message = payment_method === "promptpay_qr" 
    ? "สร้างคำขอจองแล้ว กรุณาสแกน QR code เพื่อชำระเงิน" 
    : "สร้างคำขอจองแล้ว กรุณาส่งสลิปในแชต LINE";

  return NextResponse.json({ 
    message,
    payment_method,
    booking_id: bookingData.id
  });
}
