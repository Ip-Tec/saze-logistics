import React, { useState } from "react";
import CategoryForm from "./CategoryForm";
import MenuItemForm from "./MenuItemForm";

type Category = { id: string; name: string; description?: string };
type Item = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId: string;
};

const VendorMenuManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const addCategory = (name: string, description?: string) => {
    const newCat = {
      id: crypto.randomUUID(),
      name,
      description,
    };
    setCategories([...categories, newCat]);
  };

  const addItem = (categoryId: string, item: Omit<Item, "id">) => {
    setItems([...items, { ...item, id: crypto.randomUUID(), categoryId }]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Vendor Menu Manager</h2>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="border p-4 rounded">
            <h3 className="text-xl font-semibold">{category.name}</h3>
            <p className="text-sm text-gray-500">{category.description}</p>

            <ul className="mt-2">
              {items
                .filter((item) => item.categoryId === category.id)
                .map((item) => (
                  <li key={item.id} className="ml-4">
                    🍽️ {item.name} - ${item.price.toFixed(2)}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <hr className="my-6" />

      {/* Add New Category */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Add Category</h4>
        <CategoryForm onSubmit={addCategory} />
      </div>

      {/* Add Menu Item */}
      <div>
        <h4 className="text-lg font-semibold mt-6 mb-2">Add Menu Item</h4>
        <MenuItemForm categories={categories} onSubmit={addItem} />
      </div>
    </div>
  );
};

export default VendorMenuManager;

// const CategoryForm = ({
//   onSubmit,
// }: {
//   onSubmit: (name: string, description?: string) => void;
// }) => {
//   const [name, setName] = useState("");
//   const [description, setDesc] = useState("");

//   return (
//     <form
//       className="space-y-2"
//       onSubmit={(e) => {
//         e.preventDefault();
//         onSubmit(name, description);
//         setName("");
//         setDesc("");
//       }}
//     >
//       <input
//         className="border px-2 py-1"
//         placeholder="Category name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />
//       <input
//         className="border px-2 py-1"
//         placeholder="Description"
//         value={description}
//         onChange={(e) => setDesc(e.target.value)}
//       />
//       <button
//         className="bg-blue-500 text-white px-4 py-1 rounded"
//         type="submit"
//       >
//         Add
//       </button>
//     </form>
//   );
// };

// const MenuItemForm = ({
//   categories,
//   onSubmit,
// }: {
//   categories: Category[];
//   onSubmit: (item: Omit<Item, "id">) => void;
// }) => {
//   const [categoryId, setCatId] = useState("");
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState<number>(0);

//   return (
//     <form
//       className="space-y-2"
//       onSubmit={(e) => {
//         e.preventDefault();
//         onSubmit({ name, price, categoryId, description: "", imageUrl: "" });
//         setName("");
//         setPrice(0);
//       }}
//     >
//       <select
//         value={categoryId}
//         onChange={(e) => setCatId(e.target.value)}
//         className="border px-2 py-1"
//       >
//         <option value="">Select category</option>
//         {categories.map((cat) => (
//           <option key={cat.id} value={cat.id}>
//             {cat.name}
//           </option>
//         ))}
//       </select>
//       <input
//         className="border px-2 py-1"
//         placeholder="Item name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />
//       <input
//         type="number"
//         className="border px-2 py-1"
//         placeholder="Price"
//         value={price}
//         onChange={(e) => setPrice(Number(e.target.value))}
//       />
//       <button
//         className="bg-green-500 text-white px-4 py-1 rounded"
//         type="submit"
//       >
//         Add Item
//       </button>
//     </form>
//   );
// };

