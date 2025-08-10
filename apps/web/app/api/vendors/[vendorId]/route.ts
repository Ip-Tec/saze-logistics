import { NextResponse, NextRequest } from "next/server";
import { supabaseFE  } from "@shared/supabaseClient";

export async function GET(
  req: NextRequest,
  context: { params: { vendorId: string } }
) {
  const { vendorId } = context.params;
  const { data, error } = await supabaseFE
    .from("profiles")
    .select("*")
    .eq("id", vendorId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
