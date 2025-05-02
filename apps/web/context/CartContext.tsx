"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem as CartItemType } from "@shared/types";
import { supabase } from "@shared/supabaseClient";

interface CartContextProps {
  cart: CartItemType[];
  loading: boolean;
  addToCart: (
    item: Omit<CartItemType, "quantity">,
    quantity?: number
  ) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = async ({
  children,
}) => {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const { data } = await supabase.auth.getSession();

  // On mount: fetch or create the user’s cart items from server
  useEffect(() => {
    (async () => {
      try {
        // 1) get or create cart
        const userId = data.session?.user.id;
        let carts = await fetch(`/api/cart?userId=${userId}`).then((r) =>
          r.json()
        );
        let cartId = carts?.[0]?.id;
        if (!cartId) {
          const { id: newCartId } = await fetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ userId }),
          }).then((r) => r.json());
          cartId = newCartId;
        }

        // 2) fetch cart items
        const items = await fetch(`/api/cart-item?cartId=${cartId}`).then((r) =>
          r.json()
        );
        setCart(items);
      } catch (e) {
        console.error("Failed to load cart:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addToCart = async (item: Omit<CartItemType, "quantity">, qty = 1) => {
    // Optimistically update local state
    setCart((prev) => {
      const exists = prev.find((ci) => ci.id === item.id);
      if (exists) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + qty } : ci
        );
      } else {
        return [...prev, { ...item, quantity: qty }];
      }
    });

    // Persist server‑side
    try {
      // ensure cart exists
      const userId = data.session?.user.id;
      let carts = await fetch(`/api/cart?userId=${userId}`).then((r) =>
        r.json()
      );
      let cartId = carts?.[0]?.id;
      if (!cartId) {
        const { id: newCartId } = await fetch("/api/cart", {
          method: "POST",
          body: JSON.stringify({ userId }),
        }).then((r) => r.json());
        cartId = newCartId;
      }

      // add to cart-item
      await fetch("/api/cart-item", {
        method: "POST",
        body: JSON.stringify({
          cartId,
          menuItemId: item.id,
          quantity: qty,
        }),
      });
    } catch (e) {
      console.error("Failed to persist addToCart:", e);
      // Optionally roll back local state here
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((ci) => (ci.id === cartItemId ? { ...ci, quantity } : ci))
    );

    try {
      await fetch("/api/cart-item", {
        method: "PUT",
        body: JSON.stringify({ id: cartItemId, quantity }),
      });
    } catch (e) {
      console.error("Failed to update quantity:", e);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== cartItemId));

    try {
      await fetch("/api/cart-item", {
        method: "DELETE",
        body: JSON.stringify({ id: cartItemId }),
      });
    } catch (e) {
      console.error("Failed to remove cart item:", e);
    }
  };

  const clearCart = async () => {
    setCart([]);
    // Optionally call a DELETE /api/cart to wipe server cart
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
