"use client";

import React, { useState } from "react";
import MenuForm from "@/components/vendor/MenuForm";
import MenuList from "@/components/vendor/MenuList";
import { useVendor } from "@/context/VendorContext";
import GlassButton from "@/components/ui/GlassButton";

export default function VendorMenuPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"category" | "menu">("category");

  const {
    vendorId,
    categories,
    menuItems,
    addCategory,
    addMenuItem,
  } = useVendor();

  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    addCategory(newCategory.trim(), itemDesc);
    setNewCategory("");
    setItemDesc("");
    setIsFormOpen(false);
  };

  const handleAddMenuItem = async () => {
    const price = parseFloat(itemPrice);
    if (!itemName || isNaN(price) || !itemCategoryId) return;

    addMenuItem({
      name: itemName,
      description: itemDesc,
      price: price,
      is_available: true,
      category_id: itemCategoryId,
      created_at: new Date().toISOString(),
      vendor_id: vendorId || "",
    });

    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemCategoryId("");
    setIsFormOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Vendor Menu Manager</h1>

      <div className="flex justify-end gap-4">
        <GlassButton
          onClick={() => {
            setFormType("category");
            setIsFormOpen(true);
          }}
        >
          Create Category
        </GlassButton>
        <GlassButton
          onClick={() => {
            setFormType("menu");
            setIsFormOpen(true);
          }}
        >
          Create Menu Item
        </GlassButton>
      </div>

      <MenuList categories={categories} menuItems={menuItems} />

      <MenuForm
        isOpen={isFormOpen}
        formType={formType}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
        onAddCategory={(name, description) => addCategory(name, description)}
        onAddMenuItem={({ name, description, price, category_id }) =>
          addMenuItem({
            name,
            description,
            price,
            is_available: true,
            category_id,
            created_at: new Date().toISOString(),
            vendor_id: "", // TODO: replace with actual vendor ID
          })
        }
      />
    </div>
  );
}
