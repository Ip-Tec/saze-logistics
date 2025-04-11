"use client";

import React, { useState } from "react";

type Category = {
  id: number;
  name: string;
};

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
    if (newCategory.trim() === "") return;
    const newCat: Category = {
      id: Date.now(),
      name: newCategory.trim(),
    };
    setCategories([...categories, newCat]);
    setNewCategory("");
  };

  const addMenuItem = () => {
    if (!itemName || !itemPrice || !itemCategoryId) return;
    const newItem: MenuItem = {
      id: Date.now(),
      name: itemName,
      description: itemDesc,
      price: parseFloat(itemPrice),
      categoryId: parseInt(itemCategoryId),
    };
    setMenuItems([...menuItems, newItem]);
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemCategoryId("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Vendor Menu Manager</h1>

      {/* Button to open the form */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          onClick={() => {
            setFormType("category");
            setIsFormOpen(true);
          }}
        >
          Create Category
        </button>
        <button
          className="ml-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          onClick={() => {
            setFormType("menu");
            setIsFormOpen(true);
          }}
        >
          Create Menu Item
        </button>
      </div>

      {/* Existing Menu Categories and Items */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id}>
              <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {menuItems
                  .filter((item) => item.categoryId === cat.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="border p-4 rounded bg-white shadow"
                    >
                      <h4 className="font-bold text-lg">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {item.description || "No description"}
                      </p>
                      <p className="text-right text-gray-700 font-semibold">
                        ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-in Form */}
      <div
        className={`fixed top-0 right-0 w-1/3 h-full bg-gray-100/70 backdrop-blur-3xl shadow-lg transition-transform transform ${
          isFormOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold mb-4">
            {formType === "category" ? "Add Category" : "Add Menu Item"}
          </h2>

          {/* Form for Adding Category */}
          {formType === "category" && (
            <div>
              <input
                type="text"
                className="w-full p-2 border rounded mb-3"
                placeholder="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                onClick={addCategory}
              >
                Add Category
              </button>
            </div>
          )}

          {/* Form for Adding Menu Item */}
          {formType === "menu" && (
            <div>
              <input
                type="text"
                className="w-full p-2 border rounded mb-2"
                placeholder="Food Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <textarea
                className="w-full p-2 border rounded mb-2"
                placeholder="Description (optional)"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />
              <input
                type="number"
                className="w-full p-2 border rounded mb-2"
                placeholder="Price (₦)"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <select
                className="w-full p-2 border rounded mb-3"
                value={itemCategoryId}
                onChange={(e) => setItemCategoryId(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                onClick={addMenuItem}
              >
                Add Menu Item
              </button>
            </div>
          )}

          {/* Close button for the form */}
          <button
            className="absolute top-2 right-2 w-10 h-10 bg-red-500 text-white rounded-full p-2"
            onClick={() => setIsFormOpen(false)}
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
}
