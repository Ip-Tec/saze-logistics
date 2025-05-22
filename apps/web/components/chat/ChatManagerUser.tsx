'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabaseClient'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AppUser } from '@shared/types'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  timestamp: string
}

type Conversation = {
  id: string
  type: string
}

type Participant = {
  conversation_id: string
  user_id: string
}

export default function ChatManagerUser({ currentUser }: { currentUser: AppUser }) {
  const [contacts, setContacts] = useState<AppUser[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')

  // 1. Load all vendors & riders (excluding current user)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, role')
      .in('role', ['rider', 'vendor', 'admin', 'moderator', 'support'])
      .neq('id', currentUser.id)
      .then(({ data, error }) => {
        if (error) toast.error(error.message)
        else setContacts(data as AppUser[])
      })
  }, [currentUser.id])

  // 2. Load user's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const { data: parts } = await supabase
        .from('conversation_participant')
        .select('conversation_id')
        .eq('user_id', currentUser.id)

      const ids = parts?.map((p) => p.conversation_id) || []

      if (ids.length === 0) return

      const { data: convs } = await supabase
        .from('conversation')
        .select('*')
        .in('id', ids)

      setConversations(convs || [])
    }

    fetchConversations()
  }, [currentUser.id])

  // 3. Load messages when a conversation is active
  useEffect(() => {
    if (!activeConv) return

    supabase
      .from('message')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('timestamp', { ascending: true })
      .then(({ data }) => setMessages(data || []))

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
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [activeConv])

  // 4. Start a new chat with selected user
  const startChatWith = async (otherUser: AppUser) => {
    const { data: existingConv } = await supabase
      .from('conversation_participant')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    const allConvIds = existingConv?.map((p) => p.conversation_id) || []

    // Check if conversation with otherUser already exists
    for (const convId of allConvIds) {
      const { data: participants } = await supabase
        .from('conversation_participant')
        .select('*')
        .eq('conversation_id', convId)

      const participantIds = participants?.map((p) => p.user_id)
      if (
        participantIds?.length === 2 &&
        participantIds.includes(currentUser.id) &&
        participantIds.includes(otherUser.id)
      ) {
        const { data: conv } = await supabase
          .from('conversation')
          .select('*')
          .eq('id', convId)
          .single()
        setActiveConv(conv!)
        return
      }
    }

    // Else: Create a new one
    const { data: newConv } = await supabase
      .from('conversation')
      .insert({ type: 'private' })
      .select('*')
      .single()

    const participants = [
      { conversation_id: newConv!.id, user_id: currentUser.id },
      { conversation_id: newConv!.id, user_id: otherUser.id },
    ]
    await supabase.from('conversation_participant').insert(participants)
    setConversations((prev) => [newConv!, ...prev])
    setActiveConv(newConv!)
  }

  // 5. Send message
  const sendMessage = async () => {
    if (!activeConv || !newMsg.trim()) return

    const { error } = await supabase.from('message').insert({
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      content: newMsg.trim(),
      timestamp: new Date().toISOString(),
    })

    if (error) toast.error(error.message)
    else setNewMsg('')
  }

  return (
    <div className="p-4">
      <ToastContainer />

      {/* Contact list */}
      <div className="mb-4">
        <h3 className="font-semibold">Chat with a Rider or Vendor</h3>
        <ul className="space-y-2">
          {contacts.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => startChatWith(u)}
                className="text-blue-600 underline"
              >
                {u.name} ({u.role})
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      {activeConv && (
        <div className="border rounded p-4">
          <div className="h-48 overflow-auto space-y-2 border p-2 mb-2">
            {messages.map((m) => (
              <div key={m.id}>
                <strong>
                  {m.sender_id === currentUser.id ? 'Me' : m.sender_id}
                </strong>
                : {m.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border p-2 rounded"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type your message"
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
