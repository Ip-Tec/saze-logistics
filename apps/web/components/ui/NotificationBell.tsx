'use client'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/context/NotificationContext'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  const router = useRouter()
  const { notifications } = useNotifications()
  const hasUnread = notifications.some(n => !n.read)

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => router.push('/notifications')}
      title="View notifications"
    >
      <Bell className="text-black" />
      {hasUnread && (
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  )
}
