// app/api/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // const userId = req.nextUrl.searchParams.get("userId");
  // if (!userId) {
  //   return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  // }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, logo_url")
    .eq("role", "vendor");


  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
