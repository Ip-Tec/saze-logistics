'use client';

import GlassDiv from "@/components/ui/GlassDiv"; 
import { CheckCircle, XCircle, DollarSign, AlertCircle, ThumbsDown, Truck } from "lucide-react";

const historyData = [
  {
    id: "HIST123",
    title: "Order Completed",
    date: "April 12, 2025",
    status: "Completed",
    icon: <CheckCircle className="text-green-500" size={20} />,
  },
  {
    id: "HIST124",
    title: "Order Cancelled",
    date: "April 11, 2025",
    status: "Cancelled",
    icon: <XCircle className="text-red-500" size={20} />,
  },
  {
    id: "HIST125",
    title: "Payment Received",
    date: "April 10, 2025",
    status: "Payment",
    icon: <DollarSign className="text-emerald-500" size={20} />,
  },
  {
    id: "HIST126",
    title: "Order Declined",
    date: "April 09, 2025",
    status: "Declined",
    icon: <ThumbsDown className="text-orange-400" size={20} />,
  },
  {
    id: "HIST127",
    title: "Delivery Successful",
    date: "April 08, 2025",
    status: "Successful",
    icon: <Truck className="text-blue-500" size={20} />,
  },
  {
    id: "HIST128",
    title: "Order Cancelled by Rider",
    date: "April 07, 2025",
    status: "Cancelled",
    icon: <AlertCircle className="text-red-400" size={20} />,
  },
];

export default function RiderHistoryPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Order History</h1>

      <div className="flex flex-col gap-4">
        {historyData.map((item) => (
          <GlassDiv
            key={item.id}
            className="flex items-center justify-between bg-white/10 border border-white/10 p-4 rounded-xl text-white backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-gray-300">{item.date}</p>
              </div>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                item.status === "Completed" || item.status === "Successful"
                  ? "bg-green-600 text-green-100"
                  : item.status === "Cancelled"
                  ? "bg-red-600 text-red-100"
                  : item.status === "Payment"
                  ? "bg-emerald-600 text-emerald-100"
                  : item.status === "Declined"
                  ? "bg-orange-600 text-orange-100"
                  : "bg-gray-500 text-white"
              }`}
            >
              {item.status}
            </span>
          </GlassDiv>
        ))}
      </div>
    </div>
  );
}

