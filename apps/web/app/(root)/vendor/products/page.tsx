"use client";

import React, { useState } from "react";

// Define types for form data and potentially a simulated response
interface ShipmentFormData {
  recipientName: string;
  recipientAddress: string;
  packageWeight: number;
  packageDimensions: string; // e.g., "10x20x15 cm"
  serviceType: "standard" | "express" | "international";
}

interface ShipmentCreationResponse {
  success: boolean;
  trackingNumber?: string;
  message: string;
}

const VendorLogisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "sending" | "receiving" | "selling"
  >("sending");
  const [shipmentFormData, setShipmentFormData] = useState<ShipmentFormData>({
    recipientName: "",
    recipientAddress: "",
    packageWeight: 0,
    packageDimensions: "",
    serviceType: "standard",
  });
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setShipmentFormData({
      ...shipmentFormData,
      [name]: name === "packageWeight" ? parseFloat(value) : value,
    });
  };

  const handleShipmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionStatus("Submitting shipment...");

    // --- DEMO LOGIC: Simulate API Call ---
    console.log("Submitting shipment data:", shipmentFormData);

    // In a real application, you would send shipmentFormData to your backend API
    // using fetch, axios, etc.
    // const response = await fetch('/api/create-shipment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(shipmentFormData),
    // });
    // const result: ShipmentCreationResponse = await response.json();

    // Simulate a successful response after a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const simulatedResponse: ShipmentCreationResponse = {
      success: true,
      trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
      message: "Shipment created successfully!",
    };

    // --- END DEMO LOGIC ---

    if (simulatedResponse.success) {
      setSubmissionStatus(
        `Success: ${simulatedResponse.message} Tracking Number: ${simulatedResponse.trackingNumber}`
      );
      // Reset form or redirect
      setShipmentFormData({
        recipientName: "",
        recipientAddress: "",
        packageWeight: 0,
        packageDimensions: "",
        serviceType: "standard",
      });
    } else {
      setSubmissionStatus(`Error: ${simulatedResponse.message}`);
    }
  };

  // Placeholder functions for other tabs' logic
  const handleTrackPackage = () => {
    alert("Demo: Track package logic goes here!");
    // You would typically have an input field for tracking number
    // and display tracking details after fetching from API
  };

  const handleViewOrders = () => {
    alert("Demo: View and manage sales orders logistics goes here!");
    // You would fetch vendor's sales orders and their logistics status
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Vendor Logistics Dashboard
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            className={`${activeTab === "sending" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("sending")}
          >
            Send a Shipment
          </button>
          <button
            className={`${activeTab === "receiving" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("receiving")}
          >
            Track Receiving
          </button>
          <button
            className={`${activeTab === "selling" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("selling")}
          >
            Sales Logistics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "sending" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Create New Shipment
            </h2>
            <form onSubmit={handleShipmentSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recipientName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Recipient Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  id="recipientName"
                  value={shipmentFormData.recipientName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="recipientAddress"
                  className="block text-sm font-medium text-gray-700"
                >
                  Recipient Address
                </label>
                <textarea
                  name="recipientAddress"
                  id="recipientAddress"
                  rows={3}
                  value={shipmentFormData.recipientAddress}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="packageWeight"
                  className="block text-sm font-medium text-gray-700"
                >
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  name="packageWeight"
                  id="packageWeight"
                  value={shipmentFormData.packageWeight}
                  onChange={handleInputChange}
                  required
                  min="0.1"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="packageDimensions"
                  className="block text-sm font-medium text-gray-700"
                >
                  Package Dimensions (e.g., 10x20x15 cm)
                </label>
                <input
                  type="text"
                  name="packageDimensions"
                  id="packageDimensions"
                  value={shipmentFormData.packageDimensions}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="serviceType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Service Type
                </label>
                <select
                  name="serviceType"
                  id="serviceType"
                  value={shipmentFormData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="international">International</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Shipment
                </button>
              </div>
            </form>

            {submissionStatus && (
              <div
                className={`mt-4 p-3 rounded-md ${submissionStatus.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
              >
                {submissionStatus}
              </div>
            )}
          </div>
        )}

        {activeTab === "receiving" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Track Incoming Shipments
            </h2>
            <p className="text-gray-600 mb-4">
              {/* Placeholder for tracking input and results */}
              Enter tracking number to see status of incoming packages.
            </p>
            <button
              onClick={handleTrackPackage}
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
            >
              Simulate Track
            </button>
            {/* Display tracking results here */}
          </div>
        )}

        {activeTab === "selling" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Manage Sales Order Logistics
            </h2>
            <p className="text-gray-600 mb-4">
              {/* Placeholder for listing orders and their shipping status */}
              View your sales orders and initiate shipping for them.
            </p>
            <button
              onClick={handleViewOrders}
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
            >
              Simulate View Orders
            </button>
            {/* Display order list here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorLogisticsPage;
