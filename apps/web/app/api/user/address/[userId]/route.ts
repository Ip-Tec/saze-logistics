import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  // Query delivery_address table for this user
  const { data, error } = await supabase
    .from("delivery_address")
    .select("street, city, state, postal_code, country")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }

  if (!data) {
    // No address found
    return NextResponse.json(null, { status: 204 });
  }

  // Build a single-line address string
  const { street, city, state, postal_code, country } = data;
  const addressParts = [street, city, state, postal_code, country].filter(
    Boolean
  );
  const address = addressParts.join(", ");

  return NextResponse.json({ address });
}

