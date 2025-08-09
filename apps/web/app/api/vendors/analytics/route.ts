import { NextResponse } from "next/server";
import { supabaseFE  } from "@shared/supabaseClient";

export async function GET() {
  // Replace with actual vendorId from auth
  const vendorId = "vendor-auth-id";

  // Total earnings
  const { data: earnings, error: earningsError } = await supabaseFE
    .from("orders")
    .select("total")
    .contains("items", [{ vendor_id: vendorId }]); // adjust based on schema

  if (earningsError) {
    return NextResponse.json({ error: earningsError.message }, { status: 500 });
  }

  const totalEarnings = earnings.reduce((sum: number, o: any) => sum + o.total, 0);

  // Orders this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { count, error: countError } = await supabaseFE
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .contains("items", [{ vendor_id: vendorId }]);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  return NextResponse.json({
    totalEarnings,
    ordersThisMonth: count
  });
}
