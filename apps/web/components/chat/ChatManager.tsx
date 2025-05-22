"use client";

import { useEffect, useState } from "react";
import { supabase } from "@shared/supabaseClient";
import type { Database } from "@shared/supabase/types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppUser } from "@shared/types";

type Profile = AppUser;
type Conversation = Database["public"]["Tables"]["conversation"]["Row"];
type Participant =
  Database["public"]["Tables"]["conversation_participant"]["Row"];
type Message = Database["public"]["Tables"]["message"]["Row"];
type Call = Database["public"]["Tables"]["call"]["Insert"];

export default function ChatManager({ currentUser }: { currentUser: Profile }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [newPartIds, setNewPartIds] = useState<string[]>([]);

  // 1. Load all profiles (users, vendors, riders)
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, role")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setProfiles(data as Profile[]);
      });
  }, []);

  // 2. Load ALL conversations (admin view)
  useEffect(() => {
    if (currentUser.role !== "admin") return;
    supabase
      .from("conversation")
      .select("*")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setConversations(data || []);
      });
  }, [currentUser]);

  // 3. When active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    supabase
      .from("conversation_participant")
      .select("*")
      .eq("conversation_id", activeConv.id)
      .then(({ data }) => setParticipants(data || []));

    supabase
      .from("message")
      .select("*")
      .eq("conversation_id", activeConv.id)
      .order("timestamp", { ascending: true })
      .then(({ data }) => setMessages(data || []));

    const sub = supabase
      .channel(`msg_conv_${activeConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        ({ new: m }: { new: Message }) => {
          setMessages((prev) => [...prev, m]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [activeConv]);

  // 4. Send message
  const sendMessage = async () => {
    if (!activeConv || !newMsg.trim()) return;
    const { error } = await supabase.from("message").insert({
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      content: newMsg,
      timestamp: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else setNewMsg("");
  };

  // 5. Start a new support conversation
  const createConversation = async () => {
    if (newPartIds.length === 0) return toast.error("Select at least one user");

    const { data, error: convErr } = await supabase
      .from("conversation")
      .insert({ type: "support" })
      .select("*");

    const conv = data?.[0]; // data will be an array

    if (convErr || !conv)
      return toast.error(convErr?.message || "No conversation created");

    const parts = [currentUser.id, ...newPartIds].map((uid) => ({
      conversation_id: conv.id,
      user_id: uid,
    }));

    const { error: partErr } = await supabase
      .from("conversation_participant")
      .insert(parts);

    if (partErr) return toast.error(partErr.message);

    setConversations((c) => [conv, ...c]);
    setNewPartIds([]);
    setActiveConv(conv);
  };

  return (
    <div className="p-4 space-y-6">
      <ToastContainer />

      {/* A) Start New Support Chat */}
      <div className="p-4 border rounded space-y-2">
        <h3 className="font-semibold text-lg">Start Support Chat</h3>
        <select
          multiple
          className="w-full border p-2 rounded"
          value={newPartIds}
          onChange={(e) =>
            setNewPartIds(Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {profiles
            .filter((u) => u.id !== currentUser.id)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
        </select>
        <button
          onClick={createConversation}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Support Chat
        </button>
      </div>

      {/* B) All Conversations */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {conversations.map((c) => {
          const convoParts = participants.filter(
            (p) => p.conversation_id === c.id
          );
          const displayNames = convoParts
            .map((p) => profiles.find((u) => u.id === p.user_id)?.name)
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className={`p-2 border rounded text-left ${
                activeConv?.id === c.id ? "bg-blue-100" : "bg-white"
              }`}
            >
              <strong>Chat: {c.id.slice(0, 6)}…</strong>
              <div className="text-sm text-gray-600">
                {displayNames || "Participants…"}
              </div>
            </button>
          );
        })}
      </div>

      {/* C) Active Chat Window */}
      {activeConv && (
        <div className="border rounded p-4 space-y-4">
          <h4 className="font-semibold">
            Conversation {activeConv.id.slice(0, 8)}…
          </h4>

          <div className="max-h-64 overflow-auto border p-2 space-y-2">
            {messages.map((m) => {
              const sender = profiles.find((u) => u.id === m.sender_id);
              return (
                <div key={m.id} className="flex gap-2 text-sm">
                  <strong>
                    {m.sender_id === currentUser.id
                      ? "Me"
                      : sender?.name || m.sender_id?.slice(0, 4)}
                    :
                  </strong>
                  <span>{m.content}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border px-2 py-1 rounded"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type a message…"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
