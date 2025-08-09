"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuItem, Vendor } from "@shared/types";

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function VendorMenuPage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch(`/api/profiles/${vendorId}`)
      .then((res) => res.json())
      .then((data) => {
        setVendor(data.vendor);
        setMenu(data.menu);
      });
  }, [vendorId]);

  const addToCart = (item: MenuItem): void => {
    setCart((prev: MenuItem[]) => [...prev, item]);
  };

  return (
    <div className="p-4">
      {vendor && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{vendor.name}</h1>
          {/* <p className="text-gray-500">{vendor.category}</p> */}
        </div>
      )}

      {menu.map((category) => (
        <div key={category.id} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{category.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            {category.items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 shadow flex flex-col"
              >
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="mt-1 font-semibold">₦{item.price}</p>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-auto bg-green-500 text-white py-1 rounded hover:bg-green-600"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
