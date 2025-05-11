// components/vendor/VendorTabs.tsx
import React from 'react';

interface VendorTabsProps {
  activeTab: "sending" | "receiving" | "selling" | "products";
  onTabChange: (tab: "sending" | "receiving" | "selling" | "products") => void;
}

const VendorTabs: React.FC<VendorTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "products", label: "Manage Products" },
    // { id: "sending", label: "Send a Shipment" },
    // { id: "receiving", label: "Track Receiving" },
    // { id: "selling", label: "Sales Logistics" },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => onTabChange(tab.id as "sending" | "receiving" | "selling" | "products")}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default VendorTabs;
