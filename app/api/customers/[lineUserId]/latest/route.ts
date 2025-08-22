import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET endpoint to retrieve the latest customer information for a specific LINE user ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ lineUserId: string }> }
) {
  const { lineUserId } = await params;
  
  if (!lineUserId) {
    return NextResponse.json({ error: "LINE user ID is required" }, { status: 400 });
  }

  try {
    // Fetch the most recent customer record for this LINE user ID
    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select("name, phone")
      .eq("line_user_id", lineUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching customer info:", error);
      return NextResponse.json({ error: "Failed to fetch customer information" }, { status: 500 });
    }

    if (!customer) {
      // No customer record found for this LINE ID
      return NextResponse.json({ 
        name: "", 
        phone: "",
        found: false
      });
    }

    return NextResponse.json({ 
      name: customer.name || "", 
      phone: customer.phone || "",
      found: true
    });
  } catch (error) {
    console.error("Error in customer info API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}