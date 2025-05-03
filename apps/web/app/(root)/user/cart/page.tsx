"use client";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import GlassDiv from "@/components/ui/GlassDiv";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getTotal } = useCart();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 w-full h-full mt-36 overflow-auto glass-scrollbar">
      {/* Cart Items */}
      <div className="col-span-2 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center">Your Cart</h2>
        {cart.length === 0 ? (
          <GlassDiv>
            <p className="text-center">Your cart is empty.</p>
          </GlassDiv>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-white rounded-xl shadow p-4 items-center"
            >
              <Image
                src={item.image}
                width={80}
                height={80}
                alt={item.name}
                className="rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.vendor}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="px-2 py-1 bg-gray-200 rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 bg-gray-200 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-orange-600 font-bold">
                  ₦{item.price * item.quantity}
                </p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-sm text-red-400 mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {cart.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 h-fit sticky top-4">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₦{getTotal()}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Delivery</span>
            <span>₦500</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>₦{getTotal() + 500}</span>
          </div>
          <button className="mt-6 w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600">
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
