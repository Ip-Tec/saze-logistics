// components/vendor/ProductList.tsx
import React from "react";
import ProductCard from "@/components/vendor/product/ProductCard";
import { Database } from "@shared/supabase/types";
import {ProductFormData} from "@shared/types"

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"]; //

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onAddProductClick: () => void;

  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleHideProduct: (productId: string, isHidden: boolean) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  categories, // <-- Destructure the new prop
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onToggleHideProduct,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Your Products
      </h2>
      {/* Add New Product" Button */}
      <button
        onClick={onAddProductClick}
        className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-6"
      >
        Add New Product
      </button>
      {/* Product Cards Grid */} 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categories={categories}
            onEdit={onEditProduct}
            onDelete={() => onDeleteProduct(product.id)}
            onToggleHide={() =>
              onToggleHideProduct(product.id, !product.is_hidden)
            }
          />
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            You have no products listed yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
