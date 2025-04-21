// hooks/useImageUpload.ts
import { useState } from "react";

interface UploadResult {
  url: string;
}

interface UseImageUpload {
  uploadImage: (file: File) => Promise<UploadResult | null>;
  isUploading: boolean;
  uploadError: string | null;
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>; // Added setUploadError to the interface
}

/**
 * Custom hook for uploading a single image file to a specified API endpoint.
 * Handles FormData creation and fetch request.
 *
 * @returns {UseImageUpload} An object containing the upload function, loading state, error state, and the error setter.
 */
const useImageUpload = (
  uploadEndpoint: string = "/api/upload-image"
): UseImageUpload => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Uploads a single image file.
   *
   * @param {File} file The image file to upload.
   * @returns {Promise<UploadResult | null>} A promise that resolves with the URL of the uploaded image, or null if an error occurred.
   */
  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadError(null); // Clear error at the start of a new upload

    const formData = new FormData();
    formData.append("image", file); // 'image' is the field name your backend expects

    try {
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData, // Use FormData for file uploads
        // Do NOT set Content-Type header manually for FormData,
        // the browser sets it automatically with the correct boundary
      });

      const result = await response.json();

      if (response.ok) {
        // Assuming your backend returns a JSON object like { url: '...' }
        return result as UploadResult;
      } else {
        // Handle API errors
        const errorMsg = result.error || "Image upload failed.";
        setUploadError(errorMsg);
        console.error("Image upload API error:", result.error);
        return null;
      }
    } catch (error) {
      // Handle network or other errors
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload.";
      setUploadError(errorMsg);
      console.error("Error during image upload fetch:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, uploadError, setUploadError };
};

export default useImageUpload;
