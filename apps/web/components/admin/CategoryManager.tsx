// components/admin/CategoryManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@shared/supabaseClient'
import { toast } from 'react-toastify'
import CategoryModal from './CategoryModal'
import { Trash2, Edit3, Plus } from 'lucide-react'

export type Category = {
  id: string
  name: string
  description: string | null
  image_url: string | null
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | undefined>(undefined)

  // fetch all categories
  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from<Category>('categories')
      .select('id, name, description, image_url')
      .order('created_at', { ascending: false })

    if (error) toast.error(error.message)
    else setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) toast.error(error.message)
    else {
      toast.success('Category deleted')
      setCategories(categories.filter((c) => c.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Manage Categories</h3>
        <button
          onClick={() => {
            setEditCat(undefined)
            setModalOpen(true)
          }}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded"
        >
          <Plus size={16} /> Create Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="border rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-lg font-medium">{cat.name}</h4>
                {cat.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {cat.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditCat(cat)
                    setModalOpen(true)
                  }}
                  className="p-2 border rounded hover:bg-gray-100"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 border rounded hover:bg-gray-100 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        initial={editCat}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
}
