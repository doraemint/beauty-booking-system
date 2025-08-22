import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// GET endpoint to retrieve booking history for a specific customer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ lineUserId: string }> }
) {
  const { lineUserId } = await params;
  
  if (!lineUserId) {
    return NextResponse.json({ error: "LINE user ID is required" }, { status: 400 });
  }

  // Check if request is from admin (via token) or from the customer themselves
  const isAdminRequest = isAdmin(req);

  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        start_at,
        status,
        payment_status,
        deposit_amount,
        payment_method,
        created_at,
        services!inner(name, price),
        customers!inner(name, phone)
      `)
      .eq("customers.line_user_id", lineUserId)
      .order("start_at", { ascending: false });

    // If not admin, only show confirmed or awaiting_deposit bookings
    if (!isAdminRequest) {
      query = query.in("status", ["confirmed", "awaiting_deposit", "cancelled", "no_show"]);
    }

    // Fetch customer details and their bookings
    const { data: bookings, error } = await query;

    if (error) {
      console.error("Error fetching customer bookings:", error);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }

    // Format the response
    const formattedBookings = bookings.map(booking => {
      // More robust handling of service and customer data
      const serviceName = (() => {
        if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
          const service = booking.services[0];
          return service.name || "Unnamed Service";
        }
        return "No Service";
      })();
      
      const servicePrice = (() => {
        if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
          const service = booking.services[0];
          return service.price || 0;
        }
        return 0;
      })();
      
      const customerName = (() => {
        if (booking.customers && Array.isArray(booking.customers) && booking.customers.length > 0) {
          const customer = booking.customers[0];
          return customer.name || "Unnamed Customer";
        }
        return "Unknown Customer";
      })();
      
      const customerPhone = (() => {
        if (booking.customers && Array.isArray(booking.customers) && booking.customers.length > 0) {
          const customer = booking.customers[0];
          return customer.phone || "No Phone";
        }
        return "Unknown Phone";
      })();

      return {
        id: booking.id,
        start_at: booking.start_at,
        status: booking.status,
        payment_status: booking.payment_status,
        deposit_amount: booking.deposit_amount,
        payment_method: booking.payment_method,
        created_at: booking.created_at,
        service_name: serviceName,
        service_price: servicePrice,
        customer_name: customerName,
        customer_phone: customerPhone
      };
    });

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error("Error in customer bookings API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}