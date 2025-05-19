// app/(root)/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import SummaryCard from '@/components/admin/dashboard/SummaryCard'
import ActionCard  from '@/components/admin/dashboard/ActionCard'
import ChartPanel  from '@/components/admin/dashboard/ChartPanel'
import QuickActions from '@/components/admin/dashboard/QuickActions'
import { Users, ClipboardList, Truck, CreditCard } from 'lucide-react'
import { supabase } from '@shared/supabaseClient'


export default function DashboardPage() {
  const [stats, setStats]     = useState({
    users: 0,
    vendors: 0,
    riders: 0,
    ordersToday: 0,
    revenueMonth: 0,
  })
  const [actions, setActions] = useState({
    pendingVendors: 0,
    pendingRiders: 0,
    withdrawalRequests: 0,
    openTickets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Run all queries in parallel
      const [
        { count: userCount },
        { count: vendorCount },
        { count: riderCount },
        { data: ordersTodayData, error: _oerr },
        { data: revenueMonthData, error: _rerr },
        { count: pendVendorCount },
        { count: pendRiderCount },
        { count: ticketCount },
      ] = await Promise.all([
        // users
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'user'),
        // vendors
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'vendor'),
        // riders
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'rider'),
        // orders today
        supabase
          .from('order')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfToday),
        // revenue this month
        supabase
          .rpc('sum_total_amount', {
            // replace with inline aggregation if no RPC
          }),
        // pending vendors
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'vendor')
          .eq('status', 'pending'),
        // pending riders
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'rider')
          .eq('status', 'pending'),
        // open tickets
        supabase
          .from('conversation')
          .select('*', { count: 'exact', head: true })
      ])

      // If you don't have an RPC, compute revenueMonth via:
      const { data: revenueRows } = await supabase
        .from('order')
        .select('total_amount')
        .gte('created_at', startOfMonth)
      const revSum = revenueRows?.reduce((sum, o) => sum + (o.total_amount||0), 0) ?? 0

      setStats({
        users: userCount || 0,
        vendors: vendorCount || 0,
        riders: riderCount || 0,
        ordersToday: ordersTodayData?.length ?? 0,
        revenueMonth: revSum,
      })

      setActions({
        pendingVendors: pendVendorCount || 0,
        pendingRiders: pendRiderCount || 0,
        withdrawalRequests: 0,           // adjust if you have a withdrawals table
        openTickets: ticketCount || 0,
      })

      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) return <div className="p-4 text-gray-600">Loading dashboard…</div>

  return (
    <div className="space-y-6 p-4">
      {/* 1. Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Users"        value={stats.users}        icon={<Users />}        />
        <SummaryCard title="Vendors"      value={stats.vendors}      icon={<ClipboardList />} />
        <SummaryCard title="Riders"       value={stats.riders}       icon={<Truck />}        />
        <SummaryCard title="Revenue (MTD)"value={`₦${stats.revenueMonth.toLocaleString()}`} icon={<CreditCard />} />
      </div>

      {/* 2. Action Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard title="Pending Vendors" count={actions.pendingVendors} href="/admin/vendors" />
        <ActionCard title="Pending Riders"  count={actions.pendingRiders}  href="/admin/riders" />
        <ActionCard title="Withdrawals"     count={actions.withdrawalRequests} href="/admin/payments" />
        <ActionCard title="Open Tickets"    count={actions.openTickets}    href="/admin/support" />
      </div>

      {/* 3. Charts (placeholders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Orders Over Time">
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400">
            Chart Placeholder
          </div>
        </ChartPanel>
        <ChartPanel title="Delivery Performance">
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400">
            Chart Placeholder
          </div>
        </ChartPanel>
      </div>

      {/* 4. Quick Actions & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2">Recent Error Logs</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {/* You could fetch real logs here similarly */}
            <li>[05/12/2025 14:32] Order #4532 failed payment gateway.</li>
            <li>[05/12/2025 13:10] Rider connection timeout (ID: 209).</li>
            <li>[05/11/2025 18:47] Vendor #74 upload error: image too large.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
