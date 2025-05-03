// app/(root)/user/food/[id]/FoodDetailClient.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import GlassDiv from "@/components/ui/GlassDiv";
import { MenuItem } from "@shared/types";
import DefaultImage from "@/public/images/logo.png";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";

interface FoodDetail extends MenuItem {
  image_url: string | null;
  quantity?: number;
}

export default function FoodDetailClient({ id }: { id: string }) {
  const { user } = useAuthContext();
  const { addToCart } = useCart();
  const router = useRouter();

  const [food, setFood] = useState<FoodDetail | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  console.log({ food });
  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu-item?id=${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setFood(json as FoodDetail);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!user) return router.push("/auth/login");
    if (!food) return;

    setAdding(true);
    try {
      await addToCart(
        {
          vendor: "",
          id: food.id,
          name: food.name,
          price: food.price,
          is_available: true,
          vendor_id: food.vendor_id,
          image: food.image_url ?? "",
          description: food.description,
          category_id: food.category_id ?? "",
          created_at: new Date().toISOString(),
        },
        qty
      );
      toast.success("Added to cart!");
      router.push("/user/cart");
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }
  if (!food) return <p className="text-red-600 p-4">Not found.</p>;

  return (
    <GlassDiv className="max-w-md mx-auto p-4 space-y-4">
      <ToastContainer className={"z-[9999] absolute top-4 right-4"} />
      {food.image_url && (
        <img
          width={100}
          height={100}
          alt={food.name}
          className="w-full h-64 object-cover rounded-xl"
          src={food.image_url || DefaultImage.src}
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
    </GlassDiv>
  );
}
