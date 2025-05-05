// apps/web/context/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@shared/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { Notification } from "@shared/types";


interface NotificationContextProps {
  notifications: Notification[];
  markRead: (id: string) => Promise<void>;
}

// Create the context with a default undefined value
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);


export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1) Fetch existing notifications on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, [user]);

  // 2) Subscribe to real‑time inserts
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification",
          filter: `user_id=eq.${user.id}`,
        },
        ({ new: row }) => {
          // show a toast and prepend
          toast.info(row.title);
          setNotifications((prev) => [row as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notification").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // **CRUCIAL: return your provider here**
  return (
    <NotificationContext.Provider value={{ notifications, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  }
  return ctx;
};