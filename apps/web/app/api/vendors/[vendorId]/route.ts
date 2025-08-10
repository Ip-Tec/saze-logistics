import { supabaseFE } from "@shared/supabaseClient";

import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: {
    vendorId: string;
  };
};

export async function GET(req: NextRequest, { params }: Context) {
  const { vendorId } = params;

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
