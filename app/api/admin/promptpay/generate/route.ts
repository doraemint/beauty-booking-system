import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generatePromptPayQRString } from "@/lib/promptpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });
  
  const { service_id, booking_id } = body;
  
  // Validate required fields
  if (!service_id && !booking_id) {
    return NextResponse.json({ error: "service_id หรือ booking_id ต้องระบุอย่างน้อยหนึ่งรายการ" }, { status: 400 });
  }

  try {
    let service, booking;
    
    // If booking_id is provided, fetch booking details
    if (booking_id) {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select(`
          id,
          deposit_amount,
          services(id, name, deposit)
        `)
        .eq("id", booking_id)
        .single();
        
      if (error) {
        return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
      }
      
      booking = data;
      service = data.services?.[0];
    } 
    // If service_id is provided, fetch service details
    else if (service_id) {
      const { data, error } = await supabaseAdmin
        .from("services")
        .select("id, name, deposit")
        .eq("id", service_id)
        .single();
        
      if (error) {
        return NextResponse.json({ error: "ไม่พบข้อมูลบริการ" }, { status: 404 });
      }
      
      service = data;
    }

    // Fetch PromptPay settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "promptpay")
      .single();

    if (settingsError) {
      return NextResponse.json({ error: "ไม่พบการตั้งค่า PromptPay" }, { status: 500 });
    }

    const promptpayId = settingsData.value?.promptpayId;
    const promptpayType = settingsData.value?.promptpayType || "phone";

    if (!promptpayId) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า PromptPay ID" }, { status: 400 });
    }

    // Get amount (use booking deposit if available, otherwise use service deposit)
    const amount = booking?.deposit_amount || service?.deposit || 0;

    if (amount <= 0) {
      return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
    }

    // Generate QR code
    const qrData = generatePromptPayQRString(promptpayId, amount);
    
    // Return QR code data
    return NextResponse.json({
      qr_code_data: qrData,
      amount: amount,
      service_name: service?.name || "",
      promptpay_id: promptpayId,
      promptpay_type: promptpayType
    });

  } catch (error) {
    console.error("Error generating PromptPay QR:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้าง QR code" }, { status: 500 });
  }
}