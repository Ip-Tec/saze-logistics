// app/admin/support/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notification"]["Row"];
type ConversationRow = Database["public"]["Tables"]["conversation"]["Row"];
type ParticipantRow =
  Database["public"]["Tables"]["conversation_participant"]["Row"];
type MessageRow = Database["public"]["Tables"]["message"]["Row"];

// For convenience, extend Conversation with derived fields
interface Ticket extends ConversationRow {
  participants: ParticipantRow[];
  lastMessage: MessageRow | null;
}

export default function SupportPage() {
  const [tab, setTab] = useState<"notifications" | "tickets">("notifications");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const pageSize = 10;
  const [notifCount, setNotifCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    const from = (notifPage - 1) * pageSize,
      to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("notification")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (!error) {
      setNotifications(data || []);
      setNotifCount(count || 0);
    }
    setLoading(false);
  };

  // Toggle read/unread
  const toggleRead = async (id: string, read: boolean) => {
    await supabase.from("notification").update({ read: !read }).eq("id", id);
    fetchNotifications();
  };

  // Fetch tickets (conversations) with participants + last message
  const fetchTickets = async () => {
    setLoading(true);
    const from = (ticketPage - 1) * pageSize,
      to = from + pageSize - 1;

    // 1) fetch paginated conversations
    const {
      data: convs,
      error: ce,
      count,
    } = await supabase
      .from("conversation")
      .select("*, last_activity", { count: "exact" })
      .order("last_activity", { ascending: false })
      .range(from, to);

    if (!convs || ce) {
      setLoading(false);
      return;
    }
    setTicketCount(count || 0);

    // 2) for each conversation, fetch participants & last message
    const withDetails: Ticket[] = await Promise.all(
      convs.map(async (c) => {
        const { data: parts } = await supabase
          .from("conversation_participant")
          .select("*")
          .eq("conversation_id", c.id);

        const { data: msgs } = await supabase
          .from("message")
          .select("*")
          .eq("conversation_id", c.id)
          .order("timestamp", { ascending: false })
          .limit(1);

        return {
          ...c,
          participants: parts || [],
          lastMessage: msgs && msgs.length ? msgs[0] : null,
        };
      })
    );

    setTickets(withDetails);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "notifications") fetchNotifications();
  }, [notifPage, tab]);
  useEffect(() => {
    if (tab === "tickets") fetchTickets();
  }, [ticketPage, tab]);

  // Notification table columns
  const notifCols = [
    { header: "Title", accessor: (n: NotificationRow) => n.title },
    { header: "Body", accessor: (n: NotificationRow) => n.body },
    {
      header: "Created",
      accessor: (n: NotificationRow) =>
        new Date(n.created_at!).toLocaleString(),
    },
    {
      header: "Read",
      accessor: (n: NotificationRow) => (n.read ? "Yes" : "No"),
    },
    {
      header: "Actions",
      accessor: (n: NotificationRow) => (
        <ActionButton
          label={n.read ? "Mark Unread" : "Mark Read"}
          onClick={() => toggleRead(n.id, !!n.read)}
          colorClass="bg-blue-600 text-white"
        />
      ),
    },
  ];

  // Tickets table columns
  const ticketCols = [
    { header: "Ticket ID", accessor: (t: Ticket) => t.id },
    {
      header: "Participants",
      accessor: (t: Ticket) => t.participants.map((p) => p.user_id).join(", "),
    },
    {
      header: "Last Activity",
      accessor: (t: Ticket) =>
        t.lastMessage
          ? new Date(t.lastMessage.timestamp!).toLocaleString()
          : "–",
    },
    {
      header: "Last Message",
      accessor: (t: Ticket) => t.lastMessage?.content ?? "–",
    },
    {
      header: "Actions",
      accessor: (t: Ticket) => (
        <ActionButton
          label="View"
          onClick={() => router.push(`/admin/support/${t.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Notifications & Support</h1>

      {/* Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setTab("notifications")}
          className={
            tab === "notifications"
              ? "border-b-2 border-blue-600 text-blue-600 pb-1"
              : "text-gray-600 pb-1 hover:text-gray-800"
          }
        >
          Notifications
        </button>
        <button
          onClick={() => setTab("tickets")}
          className={
            tab === "tickets"
              ? "border-b-2 border-blue-600 text-blue-600 pb-1"
              : "text-gray-600 pb-1 hover:text-gray-800"
          }
        >
          Support Tickets
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : tab === "notifications" ? (
        <>
          <DataTable<NotificationRow>
            columns={notifCols}
            data={notifications}
          />

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setNotifPage((p) => Math.max(p - 1, 1))}
              disabled={notifPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {notifPage} of {Math.ceil(notifCount / pageSize)}
            </span>
            <button
              onClick={() =>
                setNotifPage((p) =>
                  Math.min(p + 1, Math.ceil(notifCount / pageSize))
                )
              }
              disabled={notifPage === Math.ceil(notifCount / pageSize)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <DataTable<Ticket> columns={ticketCols} data={tickets} />

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setTicketPage((p) => Math.max(p - 1, 1))}
              disabled={ticketPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {ticketPage} of {Math.ceil(ticketCount / pageSize)}
            </span>
            <button
              onClick={() =>
                setTicketPage((p) =>
                  Math.min(p + 1, Math.ceil(ticketCount / pageSize))
                )
              }
              disabled={ticketPage === Math.ceil(ticketCount / pageSize)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
