// components/vendor/ShipmentForm.tsx
import React from 'react';

// Assuming ShipmentFormData and ShipmentCreationResponse types are defined
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

interface ShipmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    formData: ShipmentFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    submissionStatus: string | null;
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({
    isOpen,
    onClose,
    formData,
    onInputChange,
    onSubmit,
    submissionStatus,
}) => {
    if (!isOpen) return null; // Render only if isOpen is true

    return (
        <div className="mb-6 p-6 bg-gray-50 rounded-md shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Shipment Details</h3>
                <button
                    onClick={onClose} // Use the onClose prop
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">Recipient Name</label>
                    <input type="text" name="recipientName" id="recipientName" value={formData.recipientName} onChange={onInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700">Recipient Address</label>
                    <textarea name="recipientAddress" id="recipientAddress" rows={3} value={formData.recipientAddress} onChange={onInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                  </div>
                  <div>
                    <label htmlFor="packageWeight" className="block text-sm font-medium text-gray-700">Package Weight (kg)</label>
                    <input type="number" name="packageWeight" id="packageWeight" value={formData.packageWeight} onChange={onInputChange} required min="0.1" step="0.1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                   <div>
                    <label htmlFor="packageDimensions" className="block text-sm font-medium text-gray-700">Package Dimensions (e.g., 10x20x15 cm)</label>
                    <input type="text" name="packageDimensions" id="packageDimensions" value={formData.packageDimensions} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                  </div>
                  <div>
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">Service Type</label>
                    <select name="serviceType" id="serviceType" value={formData.serviceType} onChange={onInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="international">International</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Create Shipment</button>
                  </div>
            </form>

             {submissionStatus && (
              <div className={`mt-4 p-3 rounded-md ${submissionStatus.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                {submissionStatus}
              </div>
            )}
        </div>
    );
};

export default ShipmentForm;
