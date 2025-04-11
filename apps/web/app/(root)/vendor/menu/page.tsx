"use client";

import React, { useState } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import MenuForm from "@/components/vendor/MenuForm";
import MenuList from "@/components/vendor/MenuList";
import GlassButton from "@/components/ui/GlassButton";

type Category = { id: number; name: string };
type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
};

export default function VendorMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"category" | "menu">("category");

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: Date.now(), name: newCategory.trim() },
    ]);
    setNewCategory("");
    setIsFormOpen(false);
  };

  const addMenuItem = () => {
    if (!itemName || !itemPrice || !itemCategoryId) return;
    setMenuItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: itemName,
        description: itemDesc,
        price: parseFloat(itemPrice),
        categoryId: parseInt(itemCategoryId),
      },
    ]);
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
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        addCategory={addCategory}
        itemName={itemName}
        setItemName={setItemName}
        itemDesc={itemDesc}
        setItemDesc={setItemDesc}
        itemPrice={itemPrice}
        setItemPrice={setItemPrice}
        itemCategoryId={itemCategoryId}
        setItemCategoryId={setItemCategoryId}
        addMenuItem={addMenuItem}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
