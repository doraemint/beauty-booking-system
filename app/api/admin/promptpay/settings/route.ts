import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// GET endpoint to retrieve current PromptPay settings
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "promptpay")
      .single();

    if (error) {
      // If no settings exist yet, return empty defaults
      if (error.code === "PGRST116") {
        return NextResponse.json({
          promptpayId: "",
          promptpayType: "phone"
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.value || {
      promptpayId: "",
      promptpayType: "phone"
    });
  } catch (error) {
    console.error("Error fetching PromptPay settings:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}

// POST endpoint to save PromptPay settings
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

    const { promptpayId, promptpayType } = body;

    // Validate input
    if (!promptpayId) {
      return NextResponse.json({ error: "PromptPay ID is required" }, { status: 400 });
    }

    if (!["phone", "citizen", "wallet"].includes(promptpayType)) {
      return NextResponse.json({ error: "Invalid PromptPay type" }, { status: 400 });
    }

    // Validate format based on type
    if (promptpayType === "phone" && promptpayId.replace(/\D/g, "").length !== 10) {
      return NextResponse.json({ error: "Phone number must be 10 digits" }, { status: 400 });
    }

    if (promptpayType === "citizen" && promptpayId.replace(/\D/g, "").length !== 13) {
      return NextResponse.json({ error: "Citizen ID must be 13 digits" }, { status: 400 });
    }

    if (promptpayType === "wallet" && promptpayId.replace(/\D/g, "").length !== 15) {
      return NextResponse.json({ error: "Wallet ID must be 15 digits" }, { status: 400 });
    }

    // Save settings
    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert(
        { 
          key: "promptpay", 
          value: { promptpayId, promptpayType } 
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "PromptPay settings saved successfully",
      data: data.value
    });
  } catch (error) {
    console.error("Error saving PromptPay settings:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}