// app/api/orders/route.ts
import { createRouteHandlerClient } from '@shared/supabaseClient'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase' // Update this path to your Supabase types

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch orders for the current user
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        delivery_address,
        items,
        vendor:vendor_id(name, avatar_url),
        rider:rider_id(name, avatar_url, current_location)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform the data to match your Order interface
    const transformedOrders = orders.map(order => ({
      id: order.id,
      userId: session.user.id,
      vendorId: order.vendor_id,
      riderId: order.rider_id,
      items: order.items.map((item: any) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.created_at), // Assuming same as created if not updated
      deliveryAddress: order.delivery_address,
      paymentMethod: 'credit_card', // Adjust based on your data
      paymentStatus: 'completed' // Adjust based on your data
    }))

    return NextResponse.json(transformedOrders)

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}