import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const { services } = body;
  
  if (!services || !Array.isArray(services)) {
    return NextResponse.json({ error: "services array is required" }, { status: 400 });
  }

  try {
    // Update each service
    const updates = services.map(service => 
      supabaseAdmin
        .from("services")
        .update({ deposit: service.deposit })
        .eq("id", service.id)
    );

    // Execute all updates
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      return NextResponse.json({ error: "Failed to update some services" }, { status: 500 });
    }

    return NextResponse.json({ message: "Services updated successfully" });
  } catch (error) {
    console.error("Error updating services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}