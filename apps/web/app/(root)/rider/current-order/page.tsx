'use client';

import {
  MapPin,
  User,
  Phone,
  Package,
  Clock3,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function RiderCurrentOrderPage() {
  const order = {
    id: 'ORD12345',
    customerName: 'John Doe',
    customerPhone: '+234 812 345 6789',
    address: '24, Ikpokpan Road, GRA, Benin City, Nigeria',
    packageDetails: '2x Shawarma, 1x Bottle Water',
    amount: 5500,
    estimatedTime: '15 - 20 mins',
    status: 'In Transit',
  };

  const mapQuery = encodeURIComponent(order.address);

  return (
    <div className="w-full h-full p-4 md:p-8 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Current Order</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Order Details */}
        <div className="flex-1 backdrop-blur bg-white/30 rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Package size={18} /> Order ID: #{order.id}
            </h2>
            <p className="text-sm text-gray-600">{order.status}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User size={18} />
              <span>{order.customerName}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} />
              <span>{order.customerPhone}</span>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} />
              <span>{order.address}</span>
            </div>

            <div className="flex items-center gap-3">
              <Package size={18} />
              <span>{order.packageDetails}</span>
            </div>

            <div className="flex items-center gap-3">
              <Clock3 size={18} />
              <span>ETA: {order.estimatedTime}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold">Amount:</span>
              <span className="text-green-700 font-bold text-lg">
                ₦{order.amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Mark as Delivered
            </button>
            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2">
              <XCircle size={18} /> Cancel Order
            </button>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 h-[400px] md:h-auto rounded-2xl overflow-hidden border border-white/20 shadow-lg backdrop-blur bg-white/30">
          <iframe
            title="Delivery Route"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
