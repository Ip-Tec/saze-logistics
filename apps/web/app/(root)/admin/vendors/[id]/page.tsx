// app/admin/vendors/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DataTable from '@/components/admin/people/DataTable'
import ActionButton from '@/components/admin/people/ActionButton'
import { supabase } from '@shared/supabaseClient'
import type { Database } from '@shared/supabase/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']

export default function VendorDetailPage() {
  const { id } = useParams()           // vendor ID from URL
  const router = useRouter()
  const [vendor, setVendor]   = useState<ProfileRow | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    async function fetchData() {
      // 1) fetch vendor profile
      const { data: v, error: ve } = await supabase
        .from('profiles')
        .select('id, name, email, phone, status, role')
        .eq('id', id)
        .single()

      if (ve || !v) {
        setError(ve?.message || 'Vendor not found')
        setLoading(false)
        return
      }

      // 2) fetch products for this vendor
      const { data: prods, error: pe } = await supabase
        .from('products')
        .select('id, name, unit_price, available_quantity, is_hidden')
        .eq('vendor_id', id)
        .order('name', { ascending: true })

      if (pe) {
        setError(pe.message)
      } else {
        setVendor(v as ProfileRow)
        setProducts(prods as ProductRow[])
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) return <div className="p-4">Loading vendor…</div>
  if (error)   return <div className="p-4 text-red-600">Error: {error}</div>
  if (!vendor) return null

  // Define columns for product table
  const productColumns = [
    { header: 'Product Name', accessor: (p: ProductRow) => p.name },
    { header: 'Price (₦)',    accessor: (p: ProductRow) => p.unit_price.toFixed(2) },
    { header: 'In Stock',     accessor: (p: ProductRow) => p.available_quantity },
    { header: 'Hidden',       accessor: (p: ProductRow) => p.is_hidden ? 'Yes' : 'No' },
    {
      header: 'Actions',
      accessor: (p: ProductRow) => (
        <ActionButton
          label="Edit"
          onClick={() => router.push(`/admin/vendors/${id}/products/${p.id}/edit`)}
        />
      ),
    },
  ]

  return (
    <div className="p-4 space-y-6">
      <button 
        onClick={() => router.back()} 
        className="text-blue-600 hover:underline"
      >
        ← Back to Vendors
      </button>

      {/* Vendor Info */}
      <div className="bg-white shadow rounded p-6 space-y-2">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <p><strong>Email:</strong> {vendor.email}</p>
        <p><strong>Phone:</strong> {vendor.phone || '—'}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={vendor.status === 'approved' 
            ? 'text-green-600' 
            : vendor.status === 'pending' 
              ? 'text-yellow-600' 
              : 'text-red-600'}>
            {vendor.status}
          </span>
        </p>
      </div>

      {/* Vendor’s Products */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        <DataTable<ProductRow> columns={productColumns} data={products} />
      </div>
    </div>
  )
}
