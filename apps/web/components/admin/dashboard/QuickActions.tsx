'use client'

export default function QuickActions() {
  const actions = [
    { label: 'Reset Password', href: '/admin/users', icon: '🔑' },
    { label: 'Unlock Account', href: '/admin/users', icon: '🔓' },
    { label: 'View Logs',      href: '/admin/security', icon: '📜' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map(a => (
          <a key={a.label} href={a.href}
             className="flex items-center p-2 hover:bg-gray-100 rounded transition">
            <span className="text-xl mr-2">{a.icon}</span>
            <span className="text-sm font-medium">{a.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
