// components/vendor/ProductCard.tsx
import React from "react";

// --- Import Supabase types ---
// Adjust the path based on where your shared supabase/types.ts file is located
import { Database } from "@shared/supabase/types";

// --- Use the exact Supabase Row types ---
// This ensures the type matches the data structure from your DB query
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface ProductCardProps {
  // --- Use the corrected Product type (matches Supabase Row) ---
  product: Product; // --- Add categories prop to look up names ---
  categories: Category[]; // --- onEdit expects the corrected Product type ---
  onEdit: (product: Product) => void; // --- onDelete ID type should match Supabase (string uuid) ---
  onDelete: (productId: string) => void; // --- onToggleHide ID type should match Supabase (string uuid) ---
  onToggleHide: (productId: string, isHidden: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categories,
  onEdit,
  onDelete,
  onToggleHide,
}) => {
  // --- Find the category name using category_id and the categories prop ---
  // Add a check if categories is undefined or null just in case, though ProductList passes it
  const categoryName =
    categories?.find((cat) => cat.id === product.category_id)?.name ||
    "Unknown Category";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Use product.image_url (already correct) */}
       
      <img
        src={
          product.image_url || "https://via.placeholder.com/150?text=No+Image"
        }
        alt={product.name}
        className="w-full h-40 object-cover"
      />
       
      <div className="p-4">
          {/* Use product.name (already correct) */}     
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3> 
        {/* Use the categoryName variable derived from category_id */} 
        <p className="text-gray-600 text-sm mb-2">{categoryName}</p>     
        {/* Use product.unit_price (snake_case) - FIX for the TypeError */}     
        <p className="text-gray-800 font-bold mb-2">
          ${product.unit_price}
        </p>
          {/* Use product.available_quantity (snake_case) */} 
        <p className="text-gray-600 text-sm">
          Available: {product.available_quantity}
        </p>
        {/* Use product.is_hidden (snake_case) */}   
        <p
          className={`text-sm mt-1 ${product.is_hidden ? "text-yellow-600" : "text-green-600"}`}
        >
          {product.is_hidden ? "Hidden from users" : "Visible to users"}
        </p>
        <div className="mt-4 flex justify-between items-center text-sm">
          <button // onEdit expects the entire product object (with snake_case)
            onClick={() => onEdit(product)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            
            Edit
          </button>

          <button // onToggleHide expects product.id (string) and the current is_hidden state
            onClick={() => onToggleHide(product.id, !product.is_hidden)}
            className={`${product.is_hidden ? "text-green-600 hover:text-green-800" : "text-yellow-600 hover:text-yellow-800"} font-medium`}
          >
            {product.is_hidden ? "Unhide" : "Hide"}
          </button>

          <button // onDelete expects product.id (string)
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
