// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import path from "path"; // Used for getting file extension

// --- Supabase Configuration ---
// Ensure you have these environment variables set in your .env.local file
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY (Use the service_role key for server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// console.log({supabaseUrl, supabaseServiceRoleKey, supabaseKey});


if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase credentials not found. Check your environment variables."
  );
  // In a real application, you might want to handle this more gracefully,
  // perhaps by throwing an error during server startup or returning a 500 error
  // on every request if credentials are missing.
}

// Create a single Supabase client for the server-side
// Using the service_role key bypasses Row Level Security (RLS)
const supabase = createClient(supabaseUrl!,  supabaseKey!);

// Define your Supabase Storage bucket name
const SUPABASE_STORAGE_BUCKET = "sazzefile";

// Define the maximum allowed file size (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes

export async function POST(request: NextRequest) {
  // Check if Supabase client was initialized successfully
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Server configuration error: Supabase credentials missing." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file uploaded." },
        { status: 400 }
      );
    }

    // --- File Size Check ---
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        },
        { status: 400 }
      );
    }

    // Basic file type validation (optional but recommended)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Generate a unique path/filename for the file in Supabase Storage
    // Using a directory structure like 'uploads/' is good practice
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = `uploads/${uniqueFileName}`; // Example path in your bucket

    // --- Upload to Supabase Storage ---
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600", // Cache for 1 hour
        upsert: false, // Do not overwrite if file exists (shouldn't happen with uuid)
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      // Handle specific Supabase errors if needed
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A file with this name already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to upload image to storage." },
        { status: 500 }
      );
    }

    // Get the public URL of the uploaded file
    // Ensure your bucket is configured to be public if you want public URLs
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(
        "Supabase Storage getPublicUrl error: No public URL returned."
      );
      // This might happen if the bucket is not public or file path is wrong
      return NextResponse.json(
        { error: "Failed to get public URL for the uploaded image." },
        { status: 500 }
      );
    }

    // Return the public URL of the uploaded image
    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Error handling image upload:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload process." },
      { status: 500 }
    );
  }
}
