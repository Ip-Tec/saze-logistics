// app/(root)/user/food/[id]/page.tsx

import FoodDetailClient from "@/app/(root)/user/food/[id]/FoodDetailClient";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const foodId = (await params).id;

  return <FoodDetailClient id={foodId} />;
}
