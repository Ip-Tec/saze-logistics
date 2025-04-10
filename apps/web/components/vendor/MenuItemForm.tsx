import React, { useState } from "react";

export default function MenuItemForm({ onSubmit, categories = [] }) {
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (images.length + selectedFiles.length > 3) {
      alert("Maximum of 3 images allowed.");
      return;
    }
    setImages([...images, ...selectedFiles]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    onSubmit(formData, images);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded shadow-md"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Item Name
        </label>
        <input
          name="name"
          type="text"
          required
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          name="price"
          type="number"
          step="0.01"
          required
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          name="category_id"
          required
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Images (Max 3)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="mt-1 block w-full"
        />
        <div className="flex gap-2 mt-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={URL.createObjectURL(img)}
              alt={`Preview ${idx}`}
              className="w-20 h-20 object-cover rounded"
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Save Menu Item
      </button>
    </form>
  );
}
