import React from "react";

interface CategoryFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function CategoryForm({ onSubmit }: CategoryFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 p-4 bg-white rounded shadow-md"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category Name
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
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Category
      </button>
    </form>
  );
}
