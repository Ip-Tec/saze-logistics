// components/admin/CategoryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Category } from './CategoryManager'
import { supabase } from '@shared/supabaseClient'
import { toast } from 'react-toastify'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: Category
}

export default function CategoryModal({ open, onClose, onSaved, initial }: Props) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '')
  const [saving, setSaving] = useState(false)

  // reset when opening/closing
  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setDescription(initial?.description || '')
      setImageUrl(initial?.image_url || '')
    }
  }, [open, initial])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required')
    setSaving(true)
    let res, err
    if (isEdit && initial) {
      ;({ error: err } = await supabase
        .from('categories')
        .update({
          name,
          description,
          image_url: imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initial.id))
    } else {
      ;({ error: err } = await supabase
        .from('categories')
        .insert({
          name,
          description,
          image_url: imageUrl || null,
        }))
    }

    if (err) toast.error(err.message)
    else {
      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          {isEdit ? 'Edit Category' : 'Create Category'}
        </h2>

        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full border px-3 py-2 rounded"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input
            className="mt-1 w-full border px-3 py-2 rounded"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
