import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure the bucket exists
    const { data: bucketData, error: bucketError } = await supabaseAdmin
      .storage
      .getBucket('service-images');
    
    // If bucket doesn't exist, create it
    if (bucketError && bucketError.message.includes('Bucket not found')) {
      const { error: createError } = await supabaseAdmin
        .storage
        .createBucket('service-images', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/*']
        });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        return NextResponse.json({ error: `Failed to create bucket: ${createError.message}` }, { status: 500 });
      }
    } else if (bucketError) {
      console.error("Error getting bucket:", bucketError);
      return NextResponse.json({ error: `Failed to access bucket: ${bucketError.message}` }, { status: 500 });
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload the file to Supabase storage
    const { data, error } = await supabaseAdmin
      .storage
      .from('service-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading image to Supabase:", error);
      return NextResponse.json({ error: `Failed to upload image: ${error.message}` }, { status: 500 });
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('service-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      message: "Image uploaded successfully",
      url: publicUrl,
      path: data.path
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}