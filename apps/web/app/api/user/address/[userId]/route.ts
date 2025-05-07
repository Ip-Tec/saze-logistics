import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase client with service role key (be cautious with this key's security)
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role key for direct DB access
);

// Define the GET handler for the dynamic route
// Destructure 'params' directly from the second argument
export async function GET(
  req: NextRequest, // The first argument is the incoming request
  { params }: { params: { userId: string } } // The second argument contains dynamic route parameters
) {
  // Access the userId from the destructured params object
  const userId = params.userId;

  console.log(`Fetching address for user ID: ${userId}`);
  // Query the 'delivery_address' table for the address associated with this user ID
  // Using .single() assumes each user has at most one primary delivery address

  const { data, error } = await supabase
    .from("delivery_address")
    .select("street, city, state, postal_code, country")
    .eq("user_id", userId)
    .single(); // Handle Supabase errors, excluding the "No rows found" error (PGRST116)

  if (error && error.code !== "PGRST116") {
    console.error("Supabase error fetching address:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 } // Internal Server Error
    );
  } // If no data is returned (error code PGRST116 or data is null/undefined)

  if (!data) {
    console.log(`No address found for user ID: ${userId}`);
    return new NextResponse(null, { status: 204 }); // 204 No Content
  } // Build a single-line address string from the fetched data

  const { street, city, state, postal_code, country } = data;
  const addressParts = [street, city, state, postal_code, country].filter(
    Boolean // Filter out any null or empty string parts
  );
  const address = addressParts.join(", "); // Join with a comma and space

  console.log(`Successfully fetched address for user ID ${userId}: ${address}`); // Return the formatted address in the response

  return NextResponse.json({ address });
}
