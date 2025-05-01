// app/(root)/user/food/[id]/page.tsx

import FoodDetailClient from "@/app/(root)/user/food/[id]/FoodDetailClient";

export default function FoodDetailPage({ params }: { params: { id: string } }) {
  return <FoodDetailClient id={params.id} />;
}
