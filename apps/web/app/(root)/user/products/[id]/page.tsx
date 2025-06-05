// app/(root)/user/food/[id]/page.tsx

import ProductDetailClient from "@/app/(root)/user/products/[id]/ProductDetailClient";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const foodId = await params;
  return <ProductDetailClient id={foodId.id} />;
}
