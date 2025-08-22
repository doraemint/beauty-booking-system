import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        start_at,
        deposit_amount,
        payment_status,
        status,
        payment_method,
        payment_slip_url,
        promptpay_qr_code,
        promptpay_qr_image_url,
        customers(name, phone, line_user_id),
        services(name, price, duration_mins, deposit)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}