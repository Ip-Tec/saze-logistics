// hooks/useVendors.ts
import { useEffect, useState } from "react";
import { supabase } from "@shared/supabaseClient"; // Adjust the import path
import { Database } from "@shared/supabase/types"; // Adjust the import path

// Define a type that represents the combined data needed for a restaurant card
export type VendorForCard = {
  id: string;
  name: string;
  image_url: string | null; // Using logo_url for the card image
  description: string | null; // Using description as a placeholder for tags
  // Add other fields needed for the card if any (e.g., rating might be aggregated later)
};

// Function to fetch a limited number of random vendors
export async function fetchRandomVendors(limit = 8): Promise<VendorForCard[]> {
  try {
    const { data: vendors, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        logo_url,
        description
      `
      )
      .eq("role", "vendor") // Filter to only get vendors
      .order("random()") // Order results randomly
      .limit(limit); // Limit the number of results

    if (error) {
      console.error("Error fetching random vendors:", error);
      throw new Error(error.message);
    }

    // Map the data to the VendorForCard type
    const processedVendors: VendorForCard[] = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        image_url: vendor.logo_url, // Use logo_url for the card image
        description: vendor.description, // Use description as tags placeholder
    }));


    return processedVendors;

  } catch (error: any) {
    console.error("Unexpected error fetching random vendors:", error);
    return [];
  }
}

// Hook to use the random vendor fetching function
export function useVendors() {
  const [vendors, setVendors] = useState<VendorForCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch a limited number of random vendors for the homepage display
        const vendorList = await fetchRandomVendors(4); // Fetch e.g., 4 random vendors
        setVendors(vendorList);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadVendors();
  }, []); // Empty dependency array means this runs once on mount

  return { vendors, isLoading, error };
}