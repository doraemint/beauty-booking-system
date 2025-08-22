import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generatePromptPayQRString } from "@/lib/promptpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });
  
  const { bookingId } = body;
  
  // Validate required fields
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  try {
    // Fetch booking details with customer and service info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        deposit_amount,
        customers(name, phone),
        services(name, deposit)
      `)
      .eq("id", bookingId)
      .single();
      
    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch PromptPay settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "promptpay")
      .single();

    console.log("Settings data:", settingsData);
    console.log("Settings error:", settingsError);

    if (settingsError) {
      console.error("Settings error:", settingsError);
      return NextResponse.json({ error: "PromptPay settings not found" }, { status: 500 });
    }

    const promptpayId = settingsData.value?.promptpayId;
    const promptpayType = settingsData.value?.promptpayType || "phone";

    console.log("PromptPay ID:", promptpayId);
    console.log("PromptPay Type:", promptpayType);

    if (!promptpayId) {
      return NextResponse.json({ error: "PromptPay ID not configured. Please set it in admin settings." }, { status: 400 });
    }

    // Get amount from booking deposit
    const amount = booking.deposit_amount || booking.services?.[0]?.deposit || 0;

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Generate QR code
    const qrData = generatePromptPayQRString(promptpayId, amount);
    
    // Return QR code data in the format expected by the frontend
    return NextResponse.json({
      qrData: qrData,
      bookingInfo: {
        bookingId: booking.id,
        serviceName: booking.services?.[0]?.name || "",
        amount: amount,
        customerName: booking.customers?.[0]?.name || "",
        customerPhone: booking.customers?.[0]?.phone || ""
      }
    });

  } catch (error) {
    console.error("Error generating PromptPay QR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}