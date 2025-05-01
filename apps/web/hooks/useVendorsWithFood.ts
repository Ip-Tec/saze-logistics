// hooks/useVendorsWithFood.ts

import useSWR from "swr";

export function useVendorsWithFood(vendorCount = 6, foodsPerVendor = 6) {
  const {
    data,
    error,
    isValidating: isLoading,
  } = useSWR(
    `/api/vendors-with-food?vendorCount=${vendorCount}&foodsPerVendor=${foodsPerVendor}`,
    (url) => fetch(url).then((r) => r.json())
  );

  // If data isn’t an array, fall back to empty
  const vendorBlocks = Array.isArray(data) ? data : [];

  return {
    data: data ?? [],
    isLoading,
    error: error ? new Error(error.message || "Fetch error") : null,
  };
}
