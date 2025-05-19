// components/chat/ChatManager.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@shared/supabaseClient'
import type { Database } from '@shared/supabase/types' 
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AppUser } from '@shared/types'

type Profile = AppUser
type Conversation = Database['public']['Tables']['conversation']['Row']
type Participant = Database['public']['Tables']['conversation_participant']['Row']
type Message = Database['public']['Tables']['message']['Row']
type Call = Database['public']['Tables']['call']['Insert']

export default function ChatManager({ currentUser }: { currentUser: Profile }) {
  const [profiles, setProfiles]           = useState<Profile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv]       = useState<Conversation | null>(null)
  const [participants, setParticipants]   = useState<Participant[]>([])
  const [messages, setMessages]           = useState<Message[]>([])
  const [newMsg, setNewMsg]               = useState('')
  const [newPartIds, setNewPartIds]       = useState<string[]>([])

  // 1) Load all other profiles for "start new"
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, role')
      .neq('id', currentUser.id)
      .then(({ data, error }) => {
        if (error) toast.error(error.message)
        else setProfiles(data as Profile[])
      })
  }, [currentUser.id])

  // 2) Load conversations this user participates in
  useEffect(() => {
    supabase
      .from('conversation_participant')
      .select('conversation_id')
      .eq('user_id', currentUser.id)
      .then(async ({ data }) => {
        const convIds = (data || []).map((p) => p.conversation_id)
        if (convIds.length === 0) return
        const { data: convs } = await supabase
          .from('conversation')
          .select('*')
          .in('id', convIds)
        setConversations(convs || [])
      })
  }, [currentUser.id])

  // 3) Whenever activeConv changes, load its participants + messages & subscribe to new messages
  useEffect(() => {
    if (!activeConv) return

    // participants
    supabase
      .from('conversation_participant')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .then(({ data }) => setParticipants(data || []))

    // initial messages
    supabase
      .from('message')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('timestamp', { ascending: true })
      .then(({ data }) => setMessages(data || []))

    // realtime subscription
    const sub = supabase
      .channel(`msg_conv_${activeConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        ({ new: m }: { new: Message }) => {
          setMessages((prev) => [...prev, m])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [activeConv])

  // 4) Send a text message
  const sendMessage = async () => {
    if (!activeConv || !newMsg.trim()) return
    const { error } = await supabase
      .from('message')
      .insert({
        conversation_id: activeConv.id,
        sender_id: currentUser.id,
        content: newMsg,
        timestamp: new Date().toISOString(),
      })
    if (error) toast.error(error.message)
    else setNewMsg('')
  }

  // 5) Initiate a call to everyone else in conversation
  const startCall = async () => {
    if (!activeConv) return
    const others = participants
      .map((p) => p.user_id)
      .filter((id): id is string => !!id && id !== currentUser.id)

    const calls: Call[] = others.map((rid) => ({
      caller_id: currentUser.id,
      receiver_id: rid,
      start_time: new Date().toISOString(),
      status: 'initiated',
      type: 'chat_call',
    }))

    const { error } = await supabase.from('call').insert(calls)
    if (error) toast.error(error.message)
    else toast.success('Calling participants…')
  }

  // 6) Create a new conversation with selected participants + yourself
  const createConversation = async () => {
    if (newPartIds.length === 0) {
      return toast.error('Select at least one user')
    }
    // 6a) insert conversation row
    const { data: [conv], error: convErr } = await supabase
      .from('conversation')
      .insert({ type: 'group' })
      .select('*')
      .single()
    if (convErr) return toast.error(convErr.message)

    // 6b) add participants (you + others)
    const parts = [currentUser.id, ...newPartIds].map((uid) => ({
      conversation_id: conv.id,
      user_id: uid,
    }))
    const { error: partErr } = await supabase
      .from('conversation_participant')
      .insert(parts)
    if (partErr) return toast.error(partErr.message)

    setConversations((c) => [conv, ...c])
    setNewPartIds([])
    setActiveConv(conv)
  }

  return (
    <div className="p-4 space-y-6">
      <ToastContainer />

      {/* A) New Conversation */}
      <div className="border rounded p-4 space-y-2">
        <h3 className="font-semibold">Start New Chat</h3>
        <select
          multiple
          className="w-full border p-2 rounded"
          value={newPartIds}
          onChange={(e) =>
            setNewPartIds(
              Array.from(e.target.selectedOptions, (o) => o.value)
            )
          }
        >
          {profiles.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
        <button
          onClick={createConversation}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Chat
        </button>
      </div>

      {/* B) Conversation List */}
      <div className="grid grid-cols-2 gap-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveConv(c)}
            className={`p-2 border rounded ${
              activeConv?.id === c.id
                ? 'bg-blue-100'
                : 'bg-white'
            }`}
          >
            Chat: {c.id.slice(0, 8)}… 
            <br />
            ({/* show participants count */}{' '}
            {participants.filter((p) => p.conversation_id === c.id).length}{' '}
            users)
          </button>
        ))}
      </div>

      {/* C) Active Chat Window */}
      {activeConv && (
        <div className="border rounded p-4 space-y-4">
          <h4 className="font-semibold">
            Conversation {activeConv.id.slice(0, 8)}…
          </h4>
          <div className="max-h-64 overflow-auto border p-2 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                <strong>
                  {m.sender_id === currentUser.id
                    ? 'Me'
                    : profiles.find((u) => u.id === m.sender_id)?.name ||
                      m.sender_id?.slice(0, 4)}
                </strong>
                <span>{m.content}</span>
              </div>
            ))}
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
            <button
              onClick={startCall}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Call
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
