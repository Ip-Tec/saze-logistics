"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string; // For simplicity, a base64 or URL string
}

const availableCategories = [
  "Pizza",
  "Sushi",
  "Burgers",
  "Desserts",
  "Drinks",
  "Salads",
];

const VendorMenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState<string>(availableCategories[0]);
  const [image, setImage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (!itemName || !description || !price || !category) {
      setError("Please fill in all required fields.");
      return;
    }
    const newItem: MenuItem = {
      id: Date.now(),
      name: itemName,
      description,
      price,
      category,
      image,
    };
    setMenuItems((prev) => [...prev, newItem]);
    // Clear form fields
    setItemName("");
    setDescription("");
    setPrice(0);
    setImage("");
    setError("");
  };

  // Group menu items by category
  const groupedItems = menuItems.reduce<Record<string, MenuItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Manage Your Menu
          </h1>
          <p className="mt-2 text-gray-600">
            Add your food items, assign them to categories, and update your
            menu.
          </p>
        </div>

        {/* Form to add new menu items */}
        <form
          onSubmit={handleAddItem}
          className="bg-white shadow-md rounded-xl p-6 space-y-6"
        >
          {error && <p className="text-red-500">{error}</p>}

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Margherita Pizza"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the dish"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Price ($)
              </label>
              <input
                type="number"
                value={price === 0 ? "" : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="e.g., 9.99"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400"
                required
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
            {image && (
              <img
                src={image}
                alt="Uploaded preview"
                className="mt-2 h-24 w-auto rounded-lg border"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-lg transition shadow"
          >
            Add Item
          </button>
        </form>

        {/* Display Menu Items Grouped by Category */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Your Menu Items
          </h2>
          {menuItems.length === 0 ? (
            <p className="text-gray-500">No items added yet.</p>
          ) : (
            Object.entries(groupedItems).map(([cat, items]) => (
              <div key={cat} className="mb-8">
                <h3 className="text-xl font-bold text-gray-700 mb-4">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white shadow-md rounded-xl p-4 flex flex-col gap-3"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-40 w-full object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          {item.name}
                        </h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                      <p className="text-yellow-500 font-semibold">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorMenuPage;
