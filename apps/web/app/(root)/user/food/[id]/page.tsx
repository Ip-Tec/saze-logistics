// app/(root)/user/food/[id]/page.tsx

import { type Metadata } from "next";
import FoodDetailClient from "@/app/(root)/user/food/[id]/FoodDetailClient";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function FoodDetailPage({ params }: PageProps) {
  return <FoodDetailClient id={params.id} />;
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: `Food Item - ${params.id}`,
  };
}

