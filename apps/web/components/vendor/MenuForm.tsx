"use client";
import GlassInput from "@/components/ui/GlassInput";
import GlassTextarea from "@/components/ui/GlassTextarea";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassDiv from "@/components/ui/GlassDiv";

type Category = { id: number; name: string };
type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
};

interface MenuFormProps {
  isOpen: boolean;
  formType: "category" | "menu";
  categories: Category[];
  newCategory: string;
  setNewCategory: (val: string) => void;
  addCategory: () => void;
  itemName: string;
  setItemName: (val: string) => void;
  itemDesc: string;
  setItemDesc: (val: string) => void;
  itemPrice: string;
  setItemPrice: (val: string) => void;
  itemCategoryId: string;
  setItemCategoryId: (val: string) => void;
  addMenuItem: () => void;
  onClose: () => void;
}

export default function MenuForm({
  isOpen,
  formType,
  categories,
  newCategory,
  setNewCategory,
  addCategory,
  itemName,
  setItemName,
  itemDesc,
  setItemDesc,
  itemPrice,
  setItemPrice,
  itemCategoryId,
  setItemCategoryId,
  addMenuItem,
  onClose,
}: MenuFormProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 h-screen backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <GlassDiv
        className={`fixed z-50 top-0 right-0 w-full sm:w-[400px] h-full transition-transform transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 relative">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            {formType === "category" ? "Add Category" : "Add Menu Item"}
          </h2>

          {formType === "category" ? (
            <>
              <GlassInput
                placeholder="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <GlassButton className="w-full" onClick={addCategory}>
                Add Category
              </GlassButton>
            </>
          ) : (
            <>
              <GlassInput
                placeholder="Food Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <GlassTextarea
                placeholder="Description (optional)"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />
              <GlassInput
                placeholder="Price (₦)"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <GlassSelect
                value={itemCategoryId}
                onChange={(e) => setItemCategoryId(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </GlassSelect>
              <GlassButton className="w-full" onClick={addMenuItem}>
                Add Menu Item
              </GlassButton>
            </>
          )}

          <GlassButton
            className="absolute top-2 right-2 text-white p-2 rounded-full hover:!bg-red-500"
            onClick={onClose}
          >
            ✕
          </GlassButton>
        </div>
      </GlassDiv>
    </>
  );
}
