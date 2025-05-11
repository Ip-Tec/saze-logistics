// app/vendor/VendorLogisticsPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@shared/supabaseClient";
import { Database } from "@shared/supabase/types";
import {
  ProductFormData,
  ShipmentFormData,
  ShipmentCreationResponse,
} from "@shared/types";

import Modal from "@/components/ui/Modal";
// Import the new components
import VendorTabs from "@/components/vendor/product/VendorTabs";
import ProductList from "@/components/vendor/product/ProductList";
import ShipmentForm from "@/components/vendor/product/ShipmentForm";
import ProductFormModal from "@/components/vendor/product/ProductFormModal";
import { toast, ToastContainer } from "react-toastify";

// --- Derive Types Directly from your Database type ---
type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const VendorLogisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "sending" | "receiving" | "selling" | "products"
  >("products");

  // --- State for fetching data and handling loading/errors ---
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State for controlling form/modal visibility ---
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCreateShipmentForm, setShowCreateShipmentForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // State for Shipment form (kept for context)
  const [shipmentFormData, setShipmentFormData] = useState<ShipmentFormData>({
    recipientName: "",
    recipientAddress: "",
    packageWeight: 0,
    packageDimensions: "",
    serviceType: "standard",
  });
  const [shipmentSubmissionStatus, setShipmentSubmissionStatus] = useState<
    string | null
  >(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // --- Fetch Categories on mount ---
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*");

      if (fetchError) {
        console.error("Error fetching categories:", fetchError);
        setError("Failed to load categories.");
      } else {
        setCategories(data || []);
      }
      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  // --- Fetch Vendor Products when tab is 'products' ---
  const fetchVendorProducts = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to view your products.");
      setIsLoadingProducts(false);
      setVendorProducts([]);
      return;
    }

    setIsLoadingProducts(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", user.id);

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      setError(`Failed to load your products: ${fetchError.message}`);
      setVendorProducts([]);
    } else {
      setVendorProducts(data || []);
    }
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (activeTab === "products" && !isLoadingCategories) {
      fetchVendorProducts();
    }
  }, [activeTab, isLoadingCategories, fetchVendorProducts]);

  // --- Handler for Tab Change ---
  const handleTabChange = (
    tab: "sending" | "receiving" | "selling" | "products"
  ) => {
    setActiveTab(tab);
    setShowCreateShipmentForm(false);
    handleCloseProductModal();
  };

  // --- Handlers for Product Actions (passed to ProductList/ProductCard) ---
  const handleAddProductClick = () => {
    setEditingProduct(null);
    setShowAddProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    // Modal will open via useEffect in ProductFormModal when editingProduct changes
  };
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    confirmDeleteProduct();
  };
  
const confirmDeleteProduct = async () => {
  if (!productToDelete) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    toast.error("You must be logged in to delete products.");
    return;
  }

  const { id: productId, image_url } = productToDelete;

  setError(null);

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("vendor_id", user.id);

  if (deleteError) {
    console.error("Error deleting product:", deleteError);
    setError(`Failed to delete product: ${deleteError.message}`);
  } else {
    setVendorProducts(vendorProducts.filter((p) => p.id !== productId));
    toast.success("Product deleted successfully!");

    // Optionally delete the image
    if (image_url) {
      try {
        const deleteResponse = await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: image_url }),
        });
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          console.error("Image delete API error:", errorData);
        }

        const { error: storageError } = await supabase.storage
          .from("sazzefile")
          .remove([image_url]);

        if (storageError)
          console.error("Error deleting image from storage:", storageError);
      } catch (e) {
        console.error("Failed to delete image from storage:", e);
      }
    }
  }

  setShowDeleteModal(false);
  setProductToDelete(null);
};


  const handleToggleHideProduct = async (
    productId: string,
    isHidden: boolean
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.warning("You must be logged in to update products.");
      return;
    }

    setError(null);

    // --- Supabase Update Call ---
    const { data, error: updateError } = await supabase
      .from("products")
      .update({ is_hidden: isHidden } as ProductUpdate)
      .eq("id", productId)
      .eq("vendor_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error(
        `Error ${isHidden ? "hiding" : "unhiding"} product:`,
        updateError
      );
      setError(
        `Failed to ${isHidden ? "hide" : "unhide"} product: ${updateError.message}`
      );
    } else {
      if (data) {
        setVendorProducts(
          vendorProducts.map((p) => (p.id === productId ? data : p))
        );
      }
      toast.success(`Product ${isHidden ? "hid" : "unhid"} successfully!`);
    }
  };

  // --- Handler for Product Form Submission (passed to ProductFormModal) ---
  const handleProductFormSubmit = async (
    formData: ProductFormData,
    imageFile: File | null
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // This error will be caught by the modal's try/catch
      throw new Error("You must be logged in to add/edit products.");
    }

    setError(null);

    // Start with the existing image_url if editing and no new file is selected
    // This variable will hold the URL that will be saved to the database
    let imageUrlToSave: string | null = editingProduct?.image_url || null;

    // 1. Handle Image Upload using the API route IF a new file is selected
    if (imageFile) {
      const formDataApi = new FormData();
      formDataApi.append("image", imageFile); // Append the file under the key 'image'
      // Your API route might expect the vendor ID for structuring storage paths securely
      // formDataApi.append('vendorId', user.id);

      try {
        console.log("Uploading image via API...");
        const response = await fetch("/api/upload-image", {
          // Call your API route
          method: "POST",
          body: formDataApi, // Send the FormData object
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Image upload API error response:", errorData);
          // Throw the error so the modal's onSubmit can catch it
          throw new Error(
            errorData.error ||
              `Image upload failed with status ${response.status}.`
          );
        }

        const result = await response.json();
        if (!result.url) {
          console.error("Image upload API did not return a URL:", result);
          throw new Error("Image upload API did not return a valid URL.");
        }
        imageUrlToSave = result.url; // Get the public URL from the API response

        console.log("Image uploaded successfully. URL:", imageUrlToSave);

        // Image deletion of the old one (if editing) should happen securely on the backend.
        // You could modify your upload API to accept the old image URL/path and delete it
        // as part of the upload process, using the service role key.
        // Example (concept, implement in API):
        // if (editingProduct?.image_url) {
        //     // Call a backend function or endpoint to delete old image
        //     await fetch('/api/delete-image', { ... body: { imageUrl: editingProduct.image_url } });
        // }
      } catch (apiError: any) {
        console.error("Error calling image upload API:", apiError);
        // Propagate the error so the modal can display it
        throw new Error(`Image upload failed: ${apiError.message}`);
      }
    } else {
      // If no new file is selected, the image URL to save remains
      // the existing one (from editingProduct?.image_url) OR null if adding.
      // If you add a "Clear Image" checkbox to the form, you would check that here
      // and set imageUrlToSave = null if it's checked, AND call your delete API.
      console.log("No new image file selected. Keeping existing URL or null.");
    }

    // 2. Get Category ID from Name
    const selectedCategory = categories.find(
      (cat) => cat.name === formData.category
    );
    if (!selectedCategory) {
      // This indicates a mismatch between available categories and selected one
      console.error("Category not found:", formData.category);
      throw new Error(`Invalid category selected: ${formData.category}`);
    }
    const categoryId = selectedCategory.id;

    // 3. Insert or Update Product in Supabase
    if (formData.id) {
      // Editing existing product (ID exists)
      // Use ProductUpdate type to ensure correct structure for update payload
      const productUpdatePayload: ProductUpdate = {
        name: formData.name,
        unit_price: formData.unitPrice,
        available_quantity: formData.availableQuantity,
        category_id: categoryId,
        image_url: imageUrlToSave, // Use the determined image URL (new, existing, or null)
        description: formData.description,
        // vendor_id, is_hidden, created_at, updated_at are not typically updated directly here
      };

      console.log("Updating product in DB:", productUpdatePayload);
      // --- Supabase Update Call ---
      const { data, error: updateError } = await supabase
        .from("products")
        .update(productUpdatePayload) // Pass the typed payload
        .eq("id", formData.id) // Match the product ID
        .eq("vendor_id", user.id) // Double check vendor ownership (important for RLS)
        .select() // Select the updated row to get the latest data
        .single(); // Expecting one row back

      if (updateError) {
        console.error("Error updating product in DB:", updateError);
        // Throw the error so the modal's onSubmit can catch it
        throw new Error(`Product update failed: ${updateError.message}`);
      }

      console.log("Product updated successfully in DB:", data);
      // --- Update local state with the updated product data ---
      if (data) {
        setVendorProducts(
          vendorProducts.map((p) =>
            // Ensure we're updating the correct product with the returned data
            p.id === data.id ? data : p
          )
        );
      }
      toast.success("Product updated successfully!");
    } else {
      // Adding new product (no ID)
      // Use ProductInsert type for the insert payload
      const productInsertPayload: ProductInsert = {
        vendor_id: user.id,
        category_id: categoryId,
        name: formData.name,
        unit_price: formData.unitPrice,
        available_quantity: formData.availableQuantity,
        image_url: imageUrlToSave, // Use the determined image URL (uploaded or null)
        is_hidden: false, // New products are visible by default
        description: formData.description,
      };

      console.log("Inserting new product into DB:", productInsertPayload);
      // --- Supabase Insert Call ---
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(productInsertPayload) // Pass the typed payload
        .select() // Select the newly inserted row to get its generated ID and timestamps
        .single(); // Expecting one row back

      if (insertError) {
        console.error("Error adding product to DB:", insertError);
        // Throw the error so the modal's onSubmit can catch it
        throw new Error(`Product creation failed: ${insertError.message}`);
      }

      console.log("New product added successfully to DB:", data);
      // --- Update local state with the new product data ---
      if (data) {
        setVendorProducts([...vendorProducts, data]);
      }
      toast.success("Product added successfully!");
    }

    // The modal's onSubmit handler in ProductFormModal should
    // call onClose() if this function completes successfully (which it will
    // if no errors were thrown above).
  };

  // --- Handler for Shipment Form Submission (kept for context) ---
  // (No changes)
  const handleShipmentFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setShipmentSubmissionStatus("Submitting shipment...");

    // --- DEMO LOGIC: Replace with Supabase/API call to create shipment ---
    console.log("Submitting shipment data:", shipmentFormData);
    // In a real app, you would likely insert a row into a 'shipments' table
    // linking to the vendor_id and the relevant order/product info.
    // const { data, error } = await supabase.from('shipments').insert({...}).select().single();

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

    const simulatedResponse: ShipmentCreationResponse = {
      success: true,
      trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
      message: "Shipment created successfully!",
    };
    // --- END DEMO LOGIC ---

    if (simulatedResponse.success) {
      setShipmentSubmissionStatus(
        `Success: ${simulatedResponse.message} Tracking Number: ${simulatedResponse.trackingNumber}`
      );
      // Hide the form on success
      setShowCreateShipmentForm(false);
      setShipmentFormData({
        // Reset form
        recipientName: "",
        recipientAddress: "",
        packageWeight: 0,
        packageDimensions: "",
        serviceType: "standard",
      });
    } else {
      setShipmentSubmissionStatus(`Error: ${simulatedResponse.message}`);
    }
  };

  // --- Handler for Shipment Form Input Change (kept for context) ---
  // (No changes)
  const handleShipmentFormInputChange = (
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

  // Handler to close Product Modal
  const handleCloseProductModal = useCallback(() => {
    setShowAddProductModal(false);
    setEditingProduct(null);
    // Reset form and image states are handled internally by ProductFormModal's useEffect
  }, []);

  // Placeholder functions for other tabs' logic (kept for context)
  const handleTrackPackage = () => {
    toast.warning("Demo: Track package logic goes here! (Receiving)");
  };

  const handleViewOrders = () => {
    toast.warning(
      "Demo: View and manage sales orders logistics goes here! (Selling)"
    );
  };

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600">
        Loading vendor data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Vendor Dashboard
      </h1>

      <VendorTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div>
        {activeTab === "products" && (
          <ProductList
            products={vendorProducts}
            categories={categories}
            onAddProductClick={handleAddProductClick}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleHideProduct={handleToggleHideProduct}
          />
        )}

        {activeTab === "sending" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Ship Products or Items
            </h2>

            {!showCreateShipmentForm && (
              <button
                onClick={() => setShowCreateShipmentForm(true)}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-6"
              >
                Create New Shipment
              </button>
            )}

            <ShipmentForm
              isOpen={showCreateShipmentForm}
              onClose={() => {
                setShowCreateShipmentForm(false);
                setShipmentSubmissionStatus(null);
              }}
              formData={shipmentFormData}
              onInputChange={handleShipmentFormInputChange}
              onSubmit={handleShipmentFormSubmit}
              submissionStatus={shipmentSubmissionStatus}
            />

            {!showCreateShipmentForm && (
              <div className="text-gray-500 italic mt-4">
                List of pending/recent shipments would appear here.
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
              Enter tracking number to see status of incoming packages.
            </p>
            <button
              onClick={handleTrackPackage}
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
            >
              Simulate Track
            </button>
          </div>
        )}

        {activeTab === "selling" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Manage Sales Order Logistics
            </h2>
            <p className="text-gray-600 mb-4">
              View your sales orders and initiate shipping for them.
            </p>
            <button
              onClick={handleViewOrders}
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
            >
              Simulate View Orders
            </button>
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={showAddProductModal}
        onClose={handleCloseProductModal}
        onSubmit={handleProductFormSubmit}
        initialData={editingProduct}
        categories={categories.map((cat) => cat.name)}
      />
    </div>
  );
};

export default VendorLogisticsPage;
