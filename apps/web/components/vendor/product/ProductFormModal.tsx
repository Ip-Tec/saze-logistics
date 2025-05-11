// components/vendor/ProductFormModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import {ProductFormData, Product} from "@shared/types"


interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData, imageFile: File | null) => Promise<void>;
    initialData: Product | null;
    categories: string[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    categories,
}) => {
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        unitPrice: 0,
        availableQuantity: 0,
        category: categories[0] || "", // Default to first category or empty
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to populate form when initialData changes (for editing)
    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                name: initialData.name,
                unitPrice: initialData.unit_price,
                availableQuantity: initialData.available_quantity,
                category: initialData.category_id,
            });
            setImagePreviewUrl(initialData.image_url); // Set existing image for preview
            setImageFile(null); // Clear any previously selected file when editing
        } else {
             // Reset form and image states when adding a new product
            setFormData({
                name: "",
                unitPrice: 0,
                availableQuantity: 0,
                category: categories[0] || "",
            });
            setImageFile(null);
            setImagePreviewUrl(null);
        }
         setSubmissionStatus(null); // Clear status when opening/changing product
         setIsSubmitting(false); // Reset submitting state
    }, [initialData, categories]); // Dependency on initialData and categories

    // Effect to create preview URL when a file is selected
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImagePreviewUrl(url);
            // Clean up the object URL
            return () => URL.revokeObjectURL(url);
        } else {
             // If no file selected, keep the existing imagePreviewUrl from initialData
             if (!initialData) {
                 setImagePreviewUrl(null);
             }
        }
    }, [imageFile, initialData]);


    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: ['unitPrice', 'availableQuantity'].includes(name) ? parseFloat(value) : value,
        });
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        } else {
            setImageFile(null);
             if (!initialData) {
                 setImagePreviewUrl(null); // Clear preview only if not editing
             }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus(initialData ? "Saving changes..." : "Adding product...");

        try {
            await onSubmit(formData, imageFile); // Call the onSubmit prop provided by parent
            // Parent component will handle closing modal and showing success message
        } catch (error: any) {
            setSubmissionStatus(`Error: ${error.message || 'Something went wrong'}`);
            setIsSubmitting(false);
        }
    };

     // When closing, reset states
    const handleClose = () => {
        onClose(); // Call the onClose prop
        setSubmissionStatus(null); // Clear submission status
         setIsSubmitting(false);
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose} // Use the dedicated close handler
            title={initialData ? "Edit Product" : "Add New Product"}
        >
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input type="text" name="name" id="productName" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input type="number" name="unitPrice" id="unitPrice" value={formData.unitPrice} onChange={handleInputChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="availableQuantity" className="block text-sm font-medium text-gray-700">Number in Stock</label>
                    <input type="number" name="availableQuantity" id="availableQuantity" value={formData.availableQuantity} onChange={handleInputChange} required min="0" step="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"/>
                </div>
                 <div>
                     <label htmlFor="productImage" className="block text-sm font-medium text-gray-700">Product Image</label>
                     <input
                        type="file"
                        name="productImage"
                        id="productImage"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-purple-700 hover:file:bg-blue-100"
                     />
                     {(imagePreviewUrl || initialData?.image_url) && (
                         <div className="mt-4">
                            <p className="block text-sm font-medium text-gray-700">Preview:</p>
                             <img src={imagePreviewUrl || initialData?.image_url || ""} alt="Product Preview" className="mt-2 h-32 w-32 object-cover rounded-md border border-gray-200"/>
                         </div>
                     )}
                 </div>
                <div>
                    <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">Category</label>
                    <select name="category" id="productCategory" value={formData.category} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                </div>

                <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Product')}
                    </button>
                </div>
            </form>

             {submissionStatus && (
              <div className={`mt-4 p-3 rounded-md ${submissionStatus.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                {submissionStatus}
              </div>
            )}
        </Modal>
    );
};

export default ProductFormModal;
