import GlassDiv from "../ui/GlassDiv";

export default function OredrList() {
  return (
    <div className="w-[400px] h-full overflow-y-auto rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex flex-col gap-4 scroll-bar">
      <h2 className="text-white font-semibold text-lg mb-2 p-3">
        Recent Orders
      </h2>

      {/* Order Item */}
      {[
        {
          id: "ORD12345",
          customer: "John Doe",
          amount: 5500,
          status: "Pending",
        },
        {
          id: "ORD12346",
          customer: "Jane Smith",
          amount: 8700,
          status: "Delivered",
        },
        {
          id: "ORD12347",
          customer: "Carlos M.",
          amount: 4300,
          status: "Cancelled",
        },
        {
          id: "ORD12348",
          customer: "Amina A.",
          amount: 10200,
          status: "Processing",
        },
        {
          id: "ORD12349",
          customer: "Musa K.",
          amount: 2500,
          status: "Delivered",
        },
      ].map((order, index) => (
        <GlassDiv
          key={index}
          className="flex items-center justify-between p-4 rounded-xl !bg-white/70 !text-black border border-white/10"
        >
          <div>
            <p className="text-black text-sm font-medium">{order.customer}</p>
            <p className="text-gray-900 text-xs">#{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-green-300 font-semibold text-sm">
              ₦{order.amount.toLocaleString()}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                order.status === "Delivered"
                  ? "bg-green-600 text-green-300"
                  : order.status === "Pending"
                    ? "bg-yellow-600 text-yellow-300"
                    : order.status === "Cancelled"
                      ? "bg-red-600 text-red-300"
                      : "bg-blue-600 text-blue-300"
              }`}
            >
              {order.status}
            </span>
          </div>
        </GlassDiv>
      ))}
    </div>
  );
}
