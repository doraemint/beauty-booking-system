import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const { service } = body;
  
  if (!service) {
    return NextResponse.json({ error: "service object is required" }, { status: 400 });
  }

  try {
    // Validate required fields
    if (!service.name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }
    
    if (service.price === undefined || service.price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    
    if (service.deposit === undefined || service.deposit < 0) {
      return NextResponse.json({ error: "Valid deposit is required" }, { status: 400 });
    }
    
    if (service.duration_mins === undefined || service.duration_mins <= 0) {
      return NextResponse.json({ error: "Valid duration is required" }, { status: 400 });
    }

    // Create the service
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert({
        name: service.name,
        price: service.price,
        deposit: service.deposit,
        duration_mins: service.duration_mins,
        image_url: service.image_url || null,
        is_active: service.is_active !== undefined ? service.is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating service:", error);
      return NextResponse.json({ error: `Failed to create service: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Service created successfully",
      service: data
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}