import { NextResponse } from "next/server";
import { supabaseFE  } from "@shared/supabaseClient";

export async function GET(
  req: Request,
  { params }: { params: { vendorId: string } }
) {
  const { data, error } = await supabaseFE
    .from("profiles")
    .select("*")
    .eq("id", params.vendorId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
