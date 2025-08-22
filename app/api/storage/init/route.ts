import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    // Create service-images bucket
    const { data: serviceBucket, error: serviceError } = await supabaseAdmin
      .storage
      .createBucket('service-images', {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      });

    if (serviceError && serviceError.message !== 'Bucket already exists') {
      console.error("Error creating service-images bucket:", serviceError);
      return NextResponse.json({ error: `Failed to create service-images bucket: ${serviceError.message}` }, { status: 500 });
    }

    // Create payment-slips bucket
    const { data: paymentBucket, error: paymentError } = await supabaseAdmin
      .storage
      .createBucket('payment-slips', {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      });

    if (paymentError && paymentError.message !== 'Bucket already exists') {
      console.error("Error creating payment-slips bucket:", paymentError);
      return NextResponse.json({ error: `Failed to create payment-slips bucket: ${paymentError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Storage buckets initialized successfully",
      serviceBucket: serviceBucket || "already exists",
      paymentBucket: paymentBucket || "already exists"
    });
  } catch (error: any) {
    console.error("Error initializing storage:", error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}