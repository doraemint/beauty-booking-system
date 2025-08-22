import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("id");

  if (!serviceId) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  }

  try {
    // Instead of deleting, we'll set is_active to false to soft delete
    const { error } = await supabaseAdmin
      .from("services")
      .update({ is_active: false })
      .eq("id", serviceId);

    if (error) {
      console.error("Error deactivating service:", error);
      return NextResponse.json({ error: "Failed to deactivate service" }, { status: 500 });
    }

    return NextResponse.json({ message: "Service deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}