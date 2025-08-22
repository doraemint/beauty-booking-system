import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  
  const { name, phone, line_user_id } = body;
  
  // Validate required fields
  if (!name || !phone || !line_user_id) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    // First, verify that the booking belongs to this LINE user
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        customer_id,
        customers(line_user_id, name, phone)
      `)
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "booking not found" }, { status: 404 });
    }

    // Verify that the booking's customer belongs to this LINE user
    if (booking.customers?.line_user_id !== line_user_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Update the customer record with new name and phone
    // We'll insert a new record since we allow multiple names/phones per LINE user
    const { data: newCustomer, error: insertError } = await supabaseAdmin
      .from("customers")
      .insert({ 
        line_user_id,
        name: name.trim(), 
        phone: phone.trim() 
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update the booking to reference the new customer record
    const { error: updateBookingError } = await supabaseAdmin
      .from("bookings")
      .update({ customer_id: newCustomer.id })
      .eq("id", id);

    if (updateBookingError) {
      return NextResponse.json({ error: updateBookingError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "customer information updated successfully",
      customer_id: newCustomer.id
    });

  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}