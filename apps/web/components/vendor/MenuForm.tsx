"use client";
import { useState, useEffect } from "react";
import GlassInput from "@/components/ui/GlassInput";
import GlassTextarea from "@/components/ui/GlassTextarea";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassDiv from "@/components/ui/GlassDiv";
import { MenuCategory } from "@shared/types";

interface MenuFormProps {
  isOpen: boolean;
  formType: "category" | "menu";
  categories: MenuCategory[];
  onClose: () => void;
  onAddCategory: (name: string, description?: string) => void;
  onAddMenuItem: (item: {
    name: string;
    description: string;
    price: number;
    category_id: string;
  }) => void;
}

export default function MenuForm({
  isOpen,
  formType,
  categories,
  onClose,
  onAddCategory,
  onAddMenuItem,
}: MenuFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [itemCategoryId, setItemCategoryId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCategoryName("");
      setItemDesc("");
      setItemName("");
      setItemPrice("");
      setItemCategoryId("");
    }
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    setLoading(true);
    try {
      await onAddCategory(categoryName.trim(), itemDesc);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!itemName || !itemPrice || !itemCategoryId) return;
    setLoading(true);
    try {
      await onAddMenuItem({
        name: itemName,
        description: itemDesc,
        price: parseFloat(itemPrice),
        category_id: itemCategoryId,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 h-screen backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <GlassDiv
        className={`fixed z-50 top-0 right-0 w-full sm:w-[400px] h-full transition-transform transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e: any) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6 relative">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            {formType === "category" ? "Add Category" : "Add Menu Item"}
          </h2>

          {formType === "category" ? (
            <>
              <GlassInput
                placeholder="Category Name"
                value={categoryName}
                disabled={loading}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <GlassTextarea
                placeholder="Description (optional)"
                value={itemDesc}
                disabled={loading}
                onChange={(e) => setItemDesc(e.target.value)}
              />
              <GlassButton
                className={`w-full ${loading ? "!opacity-50" : ""}`}
                onClick={handleAddCategory}
                disabled={loading}
              >
                {loading ? "Createing..." : "Create Category"}
              </GlassButton>
            </>
          ) : (
            <>
              <GlassInput
                placeholder="Food Name"
                value={itemName}
                disabled={loading}
                onChange={(e) => setItemName(e.target.value)}
              />
              <GlassTextarea
                placeholder="Description (optional)"
                value={itemDesc}
                disabled={loading}
                onChange={(e) => setItemDesc(e.target.value)}
              />
              <GlassInput
                placeholder="Price (₦)"
                type="number"
                disabled={loading}
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <GlassSelect
                value={itemCategoryId}
                disabled={loading}
                onChange={(e) => setItemCategoryId(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </GlassSelect>
              <GlassButton
                className={`w-full ${loading ? "!opacity-50" : ""}`}
                onClick={handleAddMenuItem}
              >
                {loading ? "Adding menu..." : "Add Menu Item"}
              </GlassButton>
            </>
          )}

          <GlassButton
            className="absolute top-2 right-2 text-white p-2 rounded-full hover:!bg-red-500"
            onClick={onClose}
          >
            ✕
          </GlassButton>
        </div>
      </GlassDiv>
    </>
  );
}
