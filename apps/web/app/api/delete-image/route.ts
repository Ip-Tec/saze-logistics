// app/api/delete-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Configuration ---
// Ensure you have these environment variables set securely in your .env.local file
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANT: Use the service_role key here for elevated permissions
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Define your Supabase Storage bucket name (must match the bucket used for uploads)
const SUPABASE_STORAGE_BUCKET = "sazzefile";

// --- Supabase Client for Server-Side (Service Role) ---
// Use the service_role key to bypass RLS for this server-side operation
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "FATAL ERROR: Supabase service role credentials not found. Cannot initialize server-side client for delete API."
  );
  // In a real application, you might want a more robust startup check
}

// Create the client only if credentials are available to avoid runtime errors during startup
const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

// --- DELETE Handler ---
// Using DELETE method is semantically appropriate for deletion
export async function DELETE(request: NextRequest) {
  // Check if Supabase client was initialized successfully
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Server configuration error: Supabase credentials missing or client failed to initialize.",
      },
      { status: 500 }
    );
  }

  try {
    const { imagePath } = await request.json(); // Expecting the storage path in the request body

    if (!imagePath) {
      return NextResponse.json(
        { error: "Missing imagePath in request body. Cannot delete file." },
        { status: 400 }
      );
    }

    console.log(
      `Attempting to delete image from bucket '${SUPABASE_STORAGE_BUCKET}' at path:`,
      imagePath
    );

    // --- Delete from Supabase Storage using Service Role Client ---
    // The .remove() method takes an array of file paths within the bucket
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([imagePath]);

    if (error) {
      console.error("Supabase Storage delete error:", error);
      // Handle specific Supabase errors if needed
      if (error.message.includes("not found")) {
        // If the file wasn't found, maybe consider it a success for cleanup purposes?
        // Depends on desired behavior - here we still treat it as an error because the delete call failed.
        return NextResponse.json(
          {
            error: `Failed to delete image: File not found at path ${imagePath}`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Failed to delete image from storage: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Image deleted successfully from storage:", imagePath, data);
    return NextResponse.json(
      { success: true, message: "Image deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing image delete request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during the delete process." },
      { status: 500 }
    );
  }
}

// You could also add a POST handler that calls the DELETE handler if you prefer POST
// export async function POST(request: NextRequest) {
//     return DELETE(request);
// }
