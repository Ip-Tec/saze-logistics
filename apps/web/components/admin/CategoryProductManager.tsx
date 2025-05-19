// components/admin/CategoryProductManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@shared/supabaseClient'
import { toast } from 'react-toastify'
import GenericModal, {
  Category,
  Product,
} from './GenericModal'
import { Plus, Edit3, Trash2 } from 'lucide-react'

type CatLookup = { id: string; name: string }
type Vendor    = { id: string; name: string }

export default function CategoryProductManager() {
  const [tab, setTab] = useState<'category' | 'product'>('category')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [vendors, setVendors]       = useState<Vendor[]>([])
  const [loading, setLoading]       = useState(false)

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false)
  const [editItem, setEditItem]     = useState<Category | Product | undefined>()

  // fetch data
  const loadAll = async () => {
    setLoading(true)
    // categories
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('id, name, description, image_url')
      .order('name')
    if (catErr) toast.error(catErr.message)
    else setCategories(catData || [])

    // vendors (for product dropdown)
    const { data: venData, error: venErr } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'vendor')
      .order('name')
    if (venErr) toast.error(venErr.message)
    else setVendors(venData || [])

    // products (with join for names)
    const { data: prodRaw, error: prodErr } = await supabase
      .from('products')
      .select(`
        id, name, description, unit_price, available_quantity, image_url, is_hidden,
        category_id, vendor_id,
        categories(name),
        profiles(name)
      `)
    if (prodErr) toast.error(prodErr.message)
    else {
      setProducts(
        (prodRaw || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          image_url: p.image_url,
          unit_price: String(p.unit_price),
          available_quantity: String(p.available_quantity),
          is_hidden: p.is_hidden,
          category_id: p.category_id,
          vendor_id: p.vendor_id,
          // attach names for display
          category_name: p.categories.name,
          vendor_name: p.profiles.name,
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${tab}?`)) return
    const { error } = await supabase.from(tab === 'category' ? 'categories' : 'products')
      .delete()
      .eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} deleted`)
      loadAll()
    }
  }

  const currentList = tab === 'category' ? categories : products

  return (
    <div className="space-y-6 p-4">
      {/* Tab buttons */}
      <div className="flex gap-2">
        {(['category','product'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded ${
              tab === t 
                ? 'bg-blue-600 text-white' 
                : 'border bg-white'
            }`}
          >
            {t === 'category' ? 'Categories' : 'Products'}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditItem(undefined)
            setModalOpen(true)
          }}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded"
        >
          <Plus size={16} /> {'Create '}
          {tab === 'category' ? 'Category' : 'Product'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((item: any) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-lg font-medium">{item.name}</h4>
                {tab === 'product' && (
                  <>
                    <p className="text-sm text-gray-600">
                      Category: {item.category_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Vendor: {item.vendor_name}
                    </p>
                    <p className="mt-2">₦{parseFloat(item.unit_price).toFixed(2)}</p>
                    <p className="text-gray-500">
                      Qty: {item.available_quantity}
                    </p>
                  </>
                )}
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditItem(item)
                    setModalOpen(true)
                  }}
                  className="p-2 border rounded hover:bg-gray-100"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 border rounded hover:bg-gray-100 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The shared modal */}
      <GenericModal
        open={modalOpen}
        type={tab}
        initial={editItem}
        onClose={() => setModalOpen(false)}
        onSaved={loadAll}
        categories={categories as CatLookup[]}
        vendors={vendors}
      />
    </div>
  )
}
