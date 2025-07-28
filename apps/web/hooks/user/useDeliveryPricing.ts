// hooks/user/useDeliveryPricing.ts
import { useState, useEffect } from "react";
import { supabase } from "@shared/supabaseClient";
import { toast } from "react-toastify";

const KEYS = ["price_per_km_low", "price_per_km_high", "distance_threshold_km"];

export const useDeliveryPricing = (isLoaded: boolean) => {
  const [pricing, setPricing] = useState<{
    low: number | null;
    high: number | null;
    threshold: number;
  }>({ low: null, high: null, threshold: 3 });

  const [isPriceConfigLoading, setIsPriceConfigLoading] = useState(true);

  useEffect(() => {
    async function fetchPriceConfig() {
      if (!isLoaded) return;
      setIsPriceConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from("config")
          .select("key, value")
          .in("key", KEYS);

        if (error || !data) {
          toast.error(`Error fetching pricing configs`);
          setIsPriceConfigLoading(false);
          return;
        }

        const priceMap: Record<string, number> = {};
        for (const item of data) {
          const parsed = parseFloat(item.value);
          if (isNaN(parsed)) {
            toast.error(`Invalid value for ${item.key}`);
            continue;
          }
          priceMap[item.key] = parsed;
        }

        setPricing({
          low: priceMap["price_per_km_low"] ?? null,
          high: priceMap["price_per_km_high"] ?? null,
          threshold: priceMap["distance_threshold_km"] ?? 3,
        });
      } catch (err: any) {
        toast.error(`Error loading config: ${err.message}`);
      } finally {
        setIsPriceConfigLoading(false);
      }
    }

    fetchPriceConfig();
  }, [isLoaded]);

  return { pricing, isPriceConfigLoading };
};
