// hooks/user/useDeliveryPricing.ts
import { useState, useEffect } from "react";
import { supabase } from "@shared/supabaseClient";
import { toast } from "react-toastify";

const PRICE_PER_KM_CONFIG_KEY = "price_per_km";

export const useDeliveryPricing = (isLoaded: boolean) => {
  const [pricePerKm, setPricePerKm] = useState<number | null>(null);
  const [isPriceConfigLoading, setIsPriceConfigLoading] = useState(true);

  useEffect(() => {
    async function fetchPriceConfig() {
      if (!isLoaded) return;
      setIsPriceConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from("config")
          .select("value")
          .eq("key", PRICE_PER_KM_CONFIG_KEY)
          .single();
        if (error) {
          if (error.code === "PGRST116") {
            toast.warn(
              `Price/km config (key: ${PRICE_PER_KM_CONFIG_KEY}) not found. Booking disabled.`
            );
          } else {
            throw error;
          }
          setPricePerKm(null);
        } else if (data && data.value) {
          const parsedPrice = parseFloat(data.value);
          if (!isNaN(parsedPrice)) {
            setPricePerKm(parsedPrice);
          } else {
            toast.error(`Invalid price/km value. Booking disabled.`);
            setPricePerKm(null);
          }
        } else {
          toast.warn(`Price/km config not found. Booking disabled.`);
          setPricePerKm(null);
        }
      } catch (err: any) {
        toast.error(
          `Error fetching price/km: ${err.message}. Booking disabled.`
        );
        setPricePerKm(null);
      } finally {
        setIsPriceConfigLoading(false);
      }
    }
    fetchPriceConfig();
  }, [isLoaded]);

  return { pricePerKm, isPriceConfigLoading };
};