"use client";

import { useEffect, useState } from "react";
import { supabase } from "@shared/supabaseClient";
import { Bell } from "lucide-react";
import { toast } from "react-toastify";

type Notification = {
  id: string;
  user_id: string; // Add this
  type: string | null; // Add this, to match your DB 'type' column
  title: string;
  body: string; // Change from 'message' to 'body'
  read: boolean;
  created_at: string;
};

export default function NotificationBell({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch notifications");
    } else {
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (
            newNotification.user_id === userId &&
            newNotification.type === role
          ) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("role", role);

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          markAllAsRead();
        }}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border shadow-lg rounded-md p-2 z-50">
          <h4 className="font-bold mb-2">Notifications</h4>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No notifications</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id} className="border-b py-1 text-sm">
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
