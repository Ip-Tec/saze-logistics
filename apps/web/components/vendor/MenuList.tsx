import { Loader2 } from "lucide-react";
import { MenuCategory, MenuItem } from "@shared/types";

interface MenuListProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  isLoading: boolean; // Accept loading state
  error: Error | null; // Accept error state
}

export default function MenuList({
  categories,
  menuItems,
  isLoading, // Use loading state
  error, // Use error state
}: MenuListProps) {
  // Show loading state (optional, can be handled by parent page)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-800">
        <Loader2 size={24} className="animate-spin text-orange-500 mr-2" />
        Loading Menu...
      </div>
    );
  }

  // Show error state (optional, can be handled by parent page)
  if (error) {
    return (
      <div className="text-red-600 text-center p-8">
        <p>Error loading menu data.</p>
        <p>{error.message || String(error)}</p>
      </div>
    );
  }

  if (categories.length === 0 && menuItems.length === 0) {
    // Handle case where there are no categories OR no menu items after loading
    // This check should happen *after* isLoading is false and no error
    return (
      <p className="text-gray-50 text-center p-8">
        No menu items or categories added yet.
      </p>
    );
  }

  return (
    <div className="!w-full">
      {categories.map((cat) => {
        // Filter menu items for the current category
        const itemsInCategory = menuItems.filter(
          (item) => item.category_id === cat.id
        );

        // Only render category if it has items or if you want to show empty categories
        // For now, let's render the category header even if empty
        return (
          <div key={cat.id}>
            <h3 className="text-xl font-semibold mb-2 text-white">
              {cat.name}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {itemsInCategory.length > 0 ? (
                itemsInCategory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/20 border border-white/10 rounded-xl p-4 backdrop-blur"
                  >
                    <h4 className="font-bold text-white text-lg">
                      {item.name}
                    </h4>
                    <p className="text-sm text-white/70 mb-1">
                      {item.description || "No description"}
                    </p>
                    <p className="text-right text-white font-semibold">
                      ₦{item.price.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                // Optional: Show message if category is empty
                <p className="text-gray-50 text-sm col-span-full">
                  No items in this category.
                </p>
              )}
            </div>
          </div>
        );
      })}
      {/* Handle items that might not have a category_id or belong to a category not fetched */}
      {/* This might indicate a data issue, but good to handle defensively */}
      {/* const itemsWithoutCategory = menuItems.filter(item => !categories.some(cat => cat.id === item.category_id)); */}
      {/* if (itemsWithoutCategory.length > 0) { ... render these under a 'No Category' heading ... } */}
    </div>
  );
}
