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
    const customerId = booking.customers && booking.customers.length > 0 ? booking.customers[0].line_user_id : undefined;
    if (customerId !== line_user_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Check if customer already exists
    const { data: existingCustomer, error: selectError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("line_user_id", line_user_id)
      .maybeSingle();

    let customerIdToUpdate;

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existingCustomer) {
      // Update existing customer record
      const { data: updatedCustomer, error: updateError } = await supabaseAdmin
        .from("customers")
        .update({ 
          name: name.trim(), 
          phone: phone.trim() 
        })
        .eq("line_user_id", line_user_id)
        .select("id")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      customerIdToUpdate = updatedCustomer.id;
    } else {
      // Insert new customer record
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

      customerIdToUpdate = newCustomer.id;
    }

    // Update the booking to reference the customer record
    const { error: updateBookingError } = await supabaseAdmin
      .from("bookings")
      .update({ customer_id: customerIdToUpdate })
      .eq("id", id);

    if (updateBookingError) {
      return NextResponse.json({ error: updateBookingError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "customer information updated successfully",
      customer_id: customerIdToUpdate
    });

  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}