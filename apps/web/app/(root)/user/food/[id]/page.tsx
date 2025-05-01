// apps/web/app/(root)/user/food/[id]/page.tsx
"use client"; // only if you need client hooks (you do, for auth & router)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@shared/supabaseClient";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface FoodDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}

export default function FoodDetailPage({ params }: { params: { id: string } }) {
  const { id } = params; // ← get it from props
  const { user } = useAuthContext();
  const router = useRouter();

  const [food, setFood] = useState<FoodDetail | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch item
  // fetch item via API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu-item?id=${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Fetch failed");
        setFood(json as FoodDetail);
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // add to cart
  const handleAdd = async () => {
    if (!user) return router.push("/auth/login");
    setAdding(true);
    try {
      // get or create cart
      const { data: carts } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      let cartId = carts?.[0]?.id;
      if (!cartId) {
        const { data: newCart } = await supabase
          .from("cart")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        cartId = newCart?.id!;
      }

      // insert cart item
      await supabase.from("cart_item").insert({
        cart_id: cartId,
        menu_item_id: food!.id,
        quantity: qty,
      });

      router.push("/user/cart");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!food) return <p>Not found.</p>;

  return (
    <div className="p-4 space-y-4">
      {food.image_url && (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-full h-64 object-cover rounded-xl"
        />
      )}
      <h1 className="text-2xl font-bold">{food.name}</h1>
      <p className="text-gray-600">{food.description}</p>
      <p className="text-orange-600 text-xl font-semibold">₦{food.price}</p>

      <div className="flex items-center gap-2">
        <label>Qty:</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(+e.target.value)}
          className="w-16 p-1 border rounded"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={adding}
        className={`px-6 py-3 rounded-lg text-white ${
          adding ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {adding ? "Adding…" : "Add to Cart"}
      </button>
    </div>
  );
}
