import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const { service } = body;
  
  if (!service || !service.id) {
    return NextResponse.json({ error: "service object with id is required" }, { status: 400 });
  }

  try {
    // Update the service
    const { data, error } = await supabaseAdmin
      .from("services")
      .update({
        name: service.name,
        price: service.price,
        deposit: service.deposit,
        duration_mins: service.duration_mins,
        image_url: service.image_url || null,
        is_active: service.is_active
      })
      .eq("id", service.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating service:", error);
      return NextResponse.json({ error: `Failed to update service: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Service updated successfully",
      service: data
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}