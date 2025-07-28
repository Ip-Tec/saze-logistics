'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader } from 'lucide-react'
import {toast} from 'react-toastify'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const user = supabase.auth.getUser()

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUser = sessionData?.session?.user

      if (!currentUser) {
        toast.error('Not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', currentUser.id)
        .eq('receiver_role', 'user') // Change based on role

      if (error) toast.error(error.message)
      else setNotifications(data || [])

      setLoading(false)

      // Subscribe for real-time updates
      const sub = supabase
        .channel('notifications-feed')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          toast.success('New notification received')
        })
        .subscribe()

      return () => {
        supabase.removeChannel(sub)
      }
    }

    fetchData()
  }, [])

  const markAllRead = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData?.session?.user

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('receiver_id', currentUser?.id)

    if (!error) {
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    }
  }

  if (loading) return <div className="p-6 text-center"><Loader className="animate-spin inline" /> Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <button
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={markAllRead}
      >
        Mark all as read
      </button>
      <div className="space-y-4">
        {notifications.map((n, i) => (
          <Card key={i} className={n.read ? '' : 'border-blue-500'}>
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p>{n.message}</p>
                {!n.read && <Badge>New</Badge>}
              </div>
              <p className="text-sm text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
