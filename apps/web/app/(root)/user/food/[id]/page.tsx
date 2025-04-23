// apps/web/app/(root)/user/food/[id]/page.tsx

import { CartItem } from "@shared/types";

import FoodDetailsClient from "@/components/user/FoodDetailsClient";

// Import the placeholder image (can remain here)
import FoodPic from "@/public/images/Jollof_Rice-removebg-preview.png";

// Define the structure of the extra items (can live here or be fetched)
const AVAILABLE_EXTRAS = [
  { id: "icecream", name: "Ice Cream", price: 500, vendor: "Mama Cee" },
  { id: "water", name: "Bottled Water", price: 200, vendor: "Mama Tee" },
  {
    id: "softdrink-jee",
    name: "Soft Drink (Mama Jee)",
    price: 400,
    vendor: "Mama Jee",
  }, // Give unique IDs
  {
    id: "softdrink-lee",
    name: "Soft Drink (Mama Lee)",
    price: 400,
    vendor: "Mama Lee",
  }, // Give unique IDs
];

// Define the type for the params this page expects

// This is now an async Server Component by default
export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // *** Data Fetching on the Server ***
  // Fetch the food item data directly here in the Server Component
  let foodData: CartItem | null = null;
  try {
    // In a real app, you'd fetch from your API or directly query the DB here
    // Example fetching from your API Route:
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/foods/${id}`,
      {
        cache: "no-store", // Or other caching strategies
      }
    );
    if (!res.ok) {
      console.error(
        `Failed to fetch food item ${id}:`,
        res.status,
        res.statusText
      );
      // Optionally throw an error to trigger the nearest error.tsx boundary
      // throw new Error(`Failed to fetch food item ${id}`);
    } else {
      foodData = await res.json();
    }
  } catch (error) {
    console.error(`Error fetching food item ${id}:`, error);
    // Handle the error - maybe return a not found state or render an error message
  }

  // Handle case where food data wasn't fetched
  if (!foodData) {
    // Render a loading state or error message here if data fetching failed
    // This is server-rendered, so it's displayed immediately.
    return (
      <div className="p-4 w-full mx-auto text-center text-red-500">
        Failed to load food item or item not found.
      </div>
    );
  }

  // *** Render the layout and pass data to the Client Component ***
  return (
    // This outer div provides the main structure
    <div className="p-4 w-full mx-auto">
      {/* The Image can be rendered here as it's static */}
      {/* Although I moved it to the client component in the example for simplicity
           as the client component already renders other info. You can move it back here
           if you prefer. If you move it back, pass the image src string to the client component. */}

      {/* Pass the fetched data and available extras to the Client Component */}
      <FoodDetailsClient
        initialFood={foodData}
        availableExtras={AVAILABLE_EXTRAS} // Pass the list of extras
        FoodPic={FoodPic} // Pass the placeholder image if needed in client component
      />

      {/* Other static elements could go here */}
    </div> // Closing div for the main structure
  );
}
