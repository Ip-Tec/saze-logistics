type Category = { id: number; name: string };
type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
};

export default function MenuList({
  categories,
  menuItems,
}: {
  categories: Category[];
  menuItems: MenuItem[];
}) {
  if (categories.length === 0) {
    return <p className="text-gray-50">No categories yet.</p>;
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.id}>
          <h3 className="text-xl font-semibold mb-2 text-white">{cat.name}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {menuItems
              .filter((item) => item.categoryId === cat.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white/20 border border-white/10 rounded-xl p-4 backdrop-blur"
                >
                  <h4 className="font-bold text-white text-lg">{item.name}</h4>
                  <p className="text-sm text-white/70 mb-1">
                    {item.description || "No description"}
                  </p>
                  <p className="text-right text-white font-semibold">
                    ₦{item.price.toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
