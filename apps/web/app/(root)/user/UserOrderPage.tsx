"use client";

import React, { useState } from "react";

interface Vendor {
  id: number;
  name: string;
  image?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface Rider {
  id: number;
  name: string;
  distance: number; // distance from vendor (for simulation)
}

export default function UserOrderPage() {
  // Simulated data
  const vendors: Vendor[] = [
    { id: 1, name: "Pizza Palace", image: "/images/pizza.png" },
    { id: 2, name: "Sushi World", image: "/images/sushi.png" },
    { id: 3, name: "Burger Barn", image: "/images/burger.png" },
  ];

  const menus: Record<number, MenuItem[]> = {
    1: [
      { id: 1, name: "Margherita", description: "Classic cheese pizza", price: 9.99 },
      { id: 2, name: "Pepperoni", description: "Pepperoni pizza", price: 11.99 },
    ],
    2: [
      { id: 3, name: "California Roll", description: "Crab, avocado, cucumber", price: 7.99 },
      { id: 4, name: "Spicy Tuna Roll", description: "Fresh tuna with a kick", price: 8.99 },
    ],
    3: [
      { id: 5, name: "Cheeseburger", description: "Juicy beef patty with cheese", price: 6.99 },
      { id: 6, name: "Veggie Burger", description: "Plant-based patty", price: 7.49 },
    ],
  };

  const riders: Rider[] = [
    { id: 1, name: "Rider A", distance: 1.2 },
    { id: 2, name: "Rider B", distance: 2.5 },
    { id: 3, name: "Rider C", distance: 0.9 },
  ];

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [riderOption, setRiderOption] = useState<"auto" | "manual">("auto");
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedItems([]); // Reset previous selections
  };

  const handleMenuItemToggle = (item: MenuItem) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handlePlaceOrder = () => {
    // Here, you could send the selected vendor, menu items, and rider info to your backend
    const orderDetails = {
      vendor: selectedVendor,
      items: selectedItems,
      rider:
        riderOption === "auto"
          ? "Auto-assign rider"
          : selectedRider || "No rider selected",
    };
    console.log("Placing order:", orderDetails);
    alert("Order placed! Check console for details.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Place Your Order</h1>

      {/* Step 1: Vendor Selection */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Select a Vendor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className={`border p-4 rounded-lg cursor-pointer ${
                selectedVendor?.id === vendor.id
                  ? "border-yellow-500 bg-yellow-50"
                  : "hover:shadow-lg"
              }`}
              onClick={() => handleVendorSelect(vendor)}
            >
              {vendor.image && (
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <h3 className="text-xl font-medium text-center">{vendor.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: Menu Display */}
      {selectedVendor && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedVendor.name} Menu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menus[selectedVendor.id]?.map((item) => (
              <div
                key={item.id}
                className={`border p-4 rounded-lg cursor-pointer hover:shadow-md ${
                  selectedItems.find((i) => i.id === item.id)
                    ? "border-green-500 bg-green-50"
                    : ""
                }`}
                onClick={() => handleMenuItemToggle(item)}
              >
                <h3 className="text-xl font-medium">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
                <p className="mt-2 font-semibold text-yellow-600">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Rider Selection */}
      {selectedVendor && selectedItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Select a Rider</h2>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="auto"
                checked={riderOption === "auto"}
                onChange={() => setRiderOption("auto")}
                className="form-radio"
              />
              <span className="ml-2">Auto-assign (closest rider)</span>
            </label>
            <label className="inline-flex items-center ml-6">
              <input
                type="radio"
                value="manual"
                checked={riderOption === "manual"}
                onChange={() => setRiderOption("manual")}
                className="form-radio"
              />
              <span className="ml-2">Choose a Rider</span>
            </label>
          </div>
          {riderOption === "manual" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {riders.map((rider) => (
                <div
                  key={rider.id}
                  className={`border p-4 rounded-lg cursor-pointer hover:shadow-md ${
                    selectedRider?.id === rider.id
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => setSelectedRider(rider)}
                >
                  <h3 className="text-lg font-medium">{rider.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {rider.distance} km away
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Place Order Button */}
      {selectedVendor && selectedItems.length > 0 && (
        <div className="text-center">
          <button
            onClick={handlePlaceOrder}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}
