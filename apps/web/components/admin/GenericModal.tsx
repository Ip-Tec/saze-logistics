// components/admin/GenericModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@shared/supabaseClient'
import { toast } from 'react-toastify'

export type Category = {
  id?: string
  name: string
  description?: string
  image_url?: string
}

export type Product = {
  id?: string
  name: string
  description?: string
  image_url?: string
  unit_price: string   // we'll parse to float
  available_quantity: string // parse to int
  is_hidden: boolean
  category_id: string
  vendor_id: string
}

type Vendor = { id: string; name: string }
type CatLookup = { id: string; name: string }

interface Props {
  open: boolean
  type: 'category' | 'product'
  initial?: Category | Product
  onClose: () => void
  onSaved: () => void
  // only used for products:
  categories?: CatLookup[]
  vendors?: Vendor[]
}

export default function GenericModal({
  open,
  type,
  initial,
  onClose,
  onSaved,
  categories = [],
  vendors = [],
}: Props) {
  const isEdit = Boolean(initial)
  // shared fields
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(
    (initial as any)?.description || ''
  )
  const [imageUrl, setImageUrl] = useState((initial as any)?.image_url || '')
  // product-only fields
  const [unitPrice, setUnitPrice] = useState(
    ((initial as Product)?.unit_price as any) || '0.00'
  )
  const [availableQty, setAvailableQty] = useState(
    ((initial as Product)?.available_quantity as any) || '0'
  )
  const [isHidden, setIsHidden] = useState(
    (initial as Product)?.is_hidden || false
  )
  const [categoryId, setCategoryId] = useState(
    (initial as Product)?.category_id || categories[0]?.id || ''
  )
  const [vendorId, setVendorId] = useState(
    (initial as Product)?.vendor_id || vendors[0]?.id || ''
  )

  // reset form when modal opens / type changes / initial changes
  useEffect(() => {
    if (!open) return
    setName(initial?.name || '')
    setDescription((initial as any)?.description || '')
    setImageUrl((initial as any)?.image_url || '')
    if (type === 'product') {
      setUnitPrice(String((initial as Product)?.unit_price || '0.00'))
      setAvailableQty(String((initial as Product)?.available_quantity || '0'))
      setIsHidden((initial as Product)?.is_hidden || false)
      setCategoryId((initial as Product)?.category_id || categories[0]?.id || '')
      setVendorId((initial as Product)?.vendor_id || vendors[0]?.id || '')
    }
  }, [open, type, initial, categories, vendors])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required')
    let error = null

    if (type === 'category') {
      const payload = {
        name,
        description: description || null,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      }
      if (isEdit && (initial as Category).id) {
        ;({ error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', (initial as Category).id))
      } else {
        ;({ error } = await supabase
          .from('categories')
          .insert(payload))
      }
    } else {
      // product
      if (!categoryId || !vendorId)
        return toast.error('Category & Vendor are required')
      const payload = {
        name,
        description: description || null,
        image_url: imageUrl || null,
        unit_price: parseFloat(unitPrice) || 0,
        available_quantity: parseInt(availableQty) || 0,
        is_hidden: isHidden,
        category_id: categoryId,
        vendor_id: vendorId,
        updated_at: new Date().toISOString(),
      }
      if (isEdit && (initial as Product).id) {
        ;({ error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', (initial as Product).id))
      } else {
        ;({ error } = await supabase
          .from('products')
          .insert(payload))
      }
    }

    if (error) toast.error(error.message)
    else {
      toast.success(isEdit ? 'Updated successfully' : 'Created successfully')
      onSaved()
      onClose()
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          {isEdit ? 'Edit' : 'Create'}{' '}
          {type === 'category' ? 'Category' : 'Product'}
        </h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Product-only fields */}
        {type === 'product' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                  className="mt-1 w-full border px-3 py-2 rounded"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories!.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Vendor</label>
                <select
                  className="mt-1 w-full border px-3 py-2 rounded"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  {vendors!.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full border px-3 py-2 rounded"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Available Qty
                </label>
                <input
                  type="number"
                  className="mt-1 w-full border px-3 py-2 rounded"
                  value={availableQty}
                  onChange={(e) => setAvailableQty(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isHidden}
                    onChange={() => setIsHidden(!isHidden)}
                  />
                  <span className="ml-2">Hidden?</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className="mt-1 w-full border px-3 py-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input
            className="mt-1 w-full border px-3 py-2 rounded"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
