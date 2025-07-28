import { supabase } from "@shared/supabaseClient";

export async function getPricePerKm(distanceKm: number): Promise<number> {
  const { data, error } = await supabase
    .from("config")
    .select("key, value")
    .in("key", ["distanceThresholdKm", "lowPricePerKm", "highPricePerKm"]);

  if (error || !data) {
    console.error("Failed to fetch pricing config", error);
    throw new Error("Pricing config fetch failed");
  }

  const configMap = Object.fromEntries(data.map(d => [d.key, parseFloat(d.value)]));

  const threshold = configMap.distanceThresholdKm ?? 3;
  const low = configMap.lowPricePerKm ?? 100;
  const high = configMap.highPricePerKm ?? 200;

  return distanceKm > threshold ? high : low;
}
