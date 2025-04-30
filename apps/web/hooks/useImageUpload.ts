// hooks/useImageUpload.ts
import { useState } from "react";
import { toast } from "react-toastify"; // Assuming you have react-toastify

interface UploadResult {
  url: string;
}

interface UseImageUpload {
  // Modified: uploadImage now accepts a 'type' string
  uploadImage: (file: File, type: string) => Promise<UploadResult | null>;
  isUploading: boolean;
  uploadError: string | null;
  // Kept: setUploadError is still exposed
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
  // Added: A dedicated function to clear the error
  clearError: () => void;
}

/**
 * Custom hook for uploading a single image file to a specified API endpoint.
 * Handles FormData creation and fetch request.
 *
 * @param {string} uploadEndpoint - The API route endpoint for uploading (defaults to "/api/upload-image").
 * @returns {UseImageUpload} An object containing the upload function, loading state, error state, error setter, and a function to clear the error.
 */
const useImageUpload = (
  uploadEndpoint: string = "/api/upload-image"
): UseImageUpload => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Added: Function to clear the upload error state
  const clearError = () => {
    setUploadError(null);
  };

  /**
   * Uploads a single image file with a specified type.
   *
   * @param {File} file The image file to upload.
   * @param {string} type A string identifying the type of image (e.g., 'logo', 'banner', 'rider_image'). This is appended to FormData.
   * @returns {Promise<UploadResult | null>} A promise that resolves with the URL of the uploaded image, or null if an error occurred.
   */
  // Modified: uploadImage now accepts 'type'
  const uploadImage = async (file: File, type: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadError(null); // Clear error at the start of a new upload

    const formData = new FormData();
    // Changed field name to 'file' to match the API example discussed earlier
    formData.append("file", file);
    // Added: Append the type identifier to FormData
    formData.append("type", type);

    try {
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type header manually for FormData
      });

      const result = await response.json();

      if (response.ok) {
        // Assuming your backend returns a JSON object like { url: '...' }
        if (result.url) {
          console.log(`Image uploaded successfully (${type}):`, result.url);
          return result as UploadResult;
        } else {
          const errorMsg = result.error || `Image upload failed for type '${type}': No URL returned.`;
          setUploadError(errorMsg);
          console.error(`Image upload API error (${type}): No URL returned`, result);
          toast.error(errorMsg); // Show toast on upload error
          return null;
        }

      } else {
        // Handle API errors
        const errorMsg = result.error || `Image upload failed for type '${type}'.`;
        setUploadError(errorMsg);
        console.error(`Image upload API error (${type}):`, result.error);
         toast.error(errorMsg); // Show toast on API error
        return null;
      }
    } catch (error) {
      // Handle network or other errors
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload.";
      setUploadError(errorMsg);
      console.error(`Error during image upload fetch (${type}):`, error);
      toast.error(`Upload failed for type '${type}': ${errorMsg}`); // Show toast on fetch error
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Exposed: uploadImage, isUploading, uploadError, setUploadError, and clearError
  return { uploadImage, isUploading, uploadError, setUploadError, clearError };
};

export default useImageUpload;