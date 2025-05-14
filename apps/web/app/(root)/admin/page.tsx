// app/(root)/admin/dashboard/page.tsx

import SummaryCard from '@/components/admin/dashboard/SummaryCard'
import ActionCard  from '@/components/admin/dashboard/ActionCard'
import ChartPanel  from '@/components/admin/dashboard/ChartPanel'
import QuickActions from '@/components/admin/dashboard/QuickActions'
import { Users, ClipboardList, Truck, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  // These would be fetched via your data layer
  const stats = {
    users: 1245,
    vendors: 86,
    riders: 210,
    ordersToday: 342,
    revenueMonth: '₦12,450'
  }
  const actions = {
    pendingVendors: 5,
    pendingRiders: 8,
    withdrawalRequests: 12,
    openTickets: 3,
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Users" value={stats.users} icon={<Users />} />
        <SummaryCard title="Vendors" value={stats.vendors} icon={<ClipboardList />} />
        <SummaryCard title="Riders" value={stats.riders} icon={<Truck />} />
        <SummaryCard title="Revenue (MTD)" value={stats.revenueMonth} icon={<CreditCard />} />
      </div>

      {/* 2. Action Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard title="Pending Vendors" count={actions.pendingVendors} href="/admin/vendors" />
        <ActionCard title="Pending Riders" count={actions.pendingRiders} href="/admin/riders" />
        <ActionCard title="Withdrawals" count={actions.withdrawalRequests} href="/admin/payments" />
        <ActionCard title="Open Tickets" count={actions.openTickets} href="/admin/support" />
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Orders Over Time">
          {/* TODO: mount Chart.js line chart here */}
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
            <li>[05/12/2025 14:32] Order #4532 failed payment gateway.</li>
            <li>[05/12/2025 13:10] Rider connection timeout (ID: 209).</li>
            <li>[05/11/2025 18:47] Vendor #74 upload error: image too large.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
