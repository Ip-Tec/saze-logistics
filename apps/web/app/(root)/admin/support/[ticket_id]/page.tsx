// app/admin/support/[ticket_id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import ActionButton from "@/components/admin/people/ActionButton";

type MessageRow = Database["public"]["Tables"]["message"]["Row"];
type Participant =
  Database["public"]["Tables"]["conversation_participant"]["Row"];

export default function TicketDetailPage() {
  const { ticket_id } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversation participants + messages
  const fetchThread = async () => {
    setLoading(true);
    // participants
    const { data: parts } = await supabase
      .from("conversation_participant")
      .select("user_id")
      .eq("conversation_id", ticket_id);

    // messages
    const { data: msgs } = await supabase
      .from("message")
      .select("id, sender_id, content, timestamp")
      .eq("conversation_id", ticket_id)
      .order("timestamp", { ascending: true });

    setParticipants(parts as Participant[]);
    setMessages(msgs as MessageRow[]);
    setLoading(false);
    // scroll to bottom
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  useEffect(() => {
    if (!ticket_id) return;
    fetchThread();
  }, [ticket_id]);

  // Send a reply
  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    await supabase.from("message").insert({
      conversation_id: ticket_id,
      content: newMsg,
      timestamp: new Date().toISOString(),
    });
    setNewMsg("");
    fetchThread();
  };

  if (loading) return <div className="p-4 text-gray-600">Loading ticket…</div>;

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ← Back to Tickets
      </button>

      <h1 className="text-2xl font-semibold">Ticket: {ticket_id}</h1>
      <p className="text-sm text-gray-500">
        Participants: {participants.map((p) => p.user_id).join(", ")}
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[60vh] overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="font-medium">{m.sender_id}</span>
              <span className="text-xs text-gray-400">
                {new Date(m.timestamp!).toLocaleString()}
              </span>
            </div>
            <div className="pl-4">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="space-y-2">
        <textarea
          rows={3}
          className="w-full border px-2 py-1 rounded"
          placeholder="Type your reply…"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
        />
        <ActionButton
          label="Send"
          onClick={sendMessage}
          colorClass="bg-blue-600 text-white"
        />
      </div>
    </div>
  );
}
