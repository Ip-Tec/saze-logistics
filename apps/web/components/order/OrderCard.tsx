// components/OrderCard.tsx
import Link from "next/link";
import { Order } from "@shared/types";

interface Props {
  order: Order;
}

export default function OrderCard({ order }: Props) {
  const borderColor =
    order.status === "preparing"
      ? "border-green-500"
      : order.status === "cancelled"
      ? "border-red-500"
      : "border-gray-300";

  return (
    <Link href={`/orders/${order.id}`}>
      <div
        className={`p-4 rounded-xl border-2 hover:shadow-md transition ${borderColor}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Order #{order.id.slice(-6)}</h2>
            <p className="text-sm text-gray-500">Rider: {order.riderId}</p>
            <p className="text-sm text-gray-500">Vendor: {order.vendorId}</p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              order.status === "preparing"
                ? "bg-green-100 text-green-600"
                : order.status === "cancelled"
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status.toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Total: ₦{order.totalAmount?.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
