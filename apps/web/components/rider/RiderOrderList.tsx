// apps/web/components/rider/RiderOrderList.tsx
import GlassDiv from "@/components/ui/GlassDiv";
import { Loader2, Package, MapPin, User } from "lucide-react"; // Import icons

// Define props for the component
interface RiderOrderListProps {
    orders: {
        id: string;
        total_amount: number;
        status: string | null;
        created_at: string | null; // Include created_at for potential display/sorting
        user_id: { name: string | null } | null;
        delivery_address_id: { street: string | null; city: string | null } | null;
    }[];
    isLoading: boolean;
    error: string | null;
}

export default function RiderOrderList({ orders, isLoading, error }: RiderOrderListProps) {

    // Helper to format currency
    const formatCurrency = (amount: number | null) => {
        if (amount === null) return 'N/A';
        return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }

    // Helper to get status color
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-600 text-green-300';
            case 'pending':
                 return 'bg-gray-600 text-gray-300'; // Assuming 'pending' might appear in recent list
            case 'assigned':
                 return 'bg-blue-600 text-blue-300'; // Assuming 'assigned' might appear
            case 'picked_up':
                 return 'bg-yellow-600 text-yellow-300'; // Assuming 'picked_up' might appear
            case 'delivering':
                 return 'bg-indigo-600 text-indigo-300'; // Assuming 'delivering' might appear
            case 'cancelled':
                 return 'bg-red-600 text-red-300';
            case 'failed':
                 return 'bg-red-600 text-red-300';
            default:
                return 'bg-gray-600 text-gray-300';
        }
    }


  return (
    <GlassDiv className="w-full h-full overflow-y-auto rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/20 shadow-md flex flex-col md:gap-4 glass-scrollbar">
      <h2 className="text-orange-500 font-semibold text-lg mb-2 p-3">
        Recent Deliveries
      </h2>

      {isLoading ? (
           <div className="flex justify-center items-center h-full">
              <Loader2 size={24} className="animate-spin text-orange-500 mr-2" />
              Loading Recent Orders...
           </div>
      ) : error ? (
           <div className="text-red-600 text-center p-4">{error}</div>
      ) : orders.length === 0 ? (
           <div className="text-gray-600 text-center p-4">No recent deliveries found.</div>
      ) : (
        // Order Item List
        <div className="space-y-4"> {/* Added space between items */}
          {orders.map((order) => (
            <GlassDiv
              key={order.id} // Use order.id as key
              className="flex items-center justify-between p-4 rounded-xl !bg-white/70 !text-black border border-white/10"
            >
              <div>
                <p className="text-black text-sm font-medium flex items-center gap-1">
                    <User size={14} /> {order.user_id?.name || 'N/A'}
                </p>
                <p className="text-gray-900 text-xs flex items-center gap-1">
                     <Package size={12} /> #{order.id.substring(0, 8)} {/* Truncate ID */}
                </p>
                <p className="text-gray-600 text-xs flex items-center gap-1">
                    <MapPin size={12} /> Delivery: {
                        order.delivery_address_id
                        ? `${order.delivery_address_id.street || ''}${order.delivery_address_id.street && order.delivery_address_id.city ? ', ' : ''}${order.delivery_address_id.city || ''}`.replace(/^, /,'').replace(/, $/, '') // Construct address summary
                        : 'N/A'
                    }
                </p>
                 {/* Removed ETA as it's not in DB */}
                {/* <p className="text-gray-600 text-xs">ETA: {order.estimatedTime}</p> */}
                 <p className="text-gray-600 text-xs">
                     Date: {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                 </p>
              </div>
              <div className="text-right flex flex-col items-end"> {/* Align items to end */}
                <p className="text-green-700 font-semibold text-sm"> {/* Adjusted color and size */}
                  {formatCurrency(order.total_amount)}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize mt-1 ${getStatusColor(order.status)}`} // Added capitalize and margin-top
                >
                  {order.status?.replace('_', ' ') || 'N/A'} {/* Handle null status and format */}
                </span>
              </div>
            </GlassDiv>
          ))}
        </div>
      )}
    </GlassDiv>
  );
}
