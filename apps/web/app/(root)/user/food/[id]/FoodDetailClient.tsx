"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import GlassDiv from "@/components/ui/GlassDiv";

interface FoodDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  vendor: string;
}

export default function FoodDetailClient({ id }: { id: string }) {
  const { user } = useAuthContext();
  const { addToCart } = useCart();
  const router = useRouter();

  const [food, setFood] = useState<FoodDetail | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu-item?id=${id}`)
      .then((res) =>
        res.json().then((json) => {
          if (!res.ok) throw new Error(json.error ?? "Fetch failed");
          return json as FoodDetail;
        })
      )
      .then(setFood)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!user) return router.push("/auth/login");
    if (!food) return;

    setAdding(true);
    try {
      await addToCart(
        {
          id: food.id,
          name: food.name,
          vendor: food.vendor,
          price: food.price,
          image: food.image_url ?? "",
          vendor_id: food.vendor,
          is_available: true,
          created_at: new Date().toString(),
        },
        qty
      );
      router.push("/user/cart");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex m-auto justify-center items-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-orange-500" />
        <span className="ml-4 text-lg">Loading data...</span>
      </div>
    );
  }
  if (error) return <p className="text-red-600">{error}</p>;
  if (!food) return <p>Not found.</p>;

  return (
    <GlassDiv className="max-w-md m-auto">
      <div className="p-4 w-full m-auto flex flex-col items-center justify-center my-4 gap-2">
        {food.image_url && (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-64 object-cover rounded-xl"
          />
        )}
        <h1 className="text-2xl font-bold">{food.name}</h1>
        <p className="text-gray-600">{food.description}</p>
        <div className="flex items-center gap-2">
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
    </GlassDiv>
  );
}
