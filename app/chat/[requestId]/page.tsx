'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { ArrowLeft, Send, Cat as CatIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RequestInfo {
  id: string
  renter_id: string
  status: string
  cats: {
    id: string
    name: string
    breed: string
    photo_url?: string
    owner_id: string
    profiles?: { full_name: string }
  }
  profiles: { full_name: string }
}

export default function ChatPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const [{ data: reqData }, { data: msgs }] = await Promise.all([
        supabase
          .from('rental_requests')
          .select('*, cats(id, name, breed, photo_url, owner_id, profiles(full_name)), profiles(full_name)')
          .eq('id', requestId)
          .single(),
        supabase
          .from('messages')
          .select('*, profiles(full_name)')
          .eq('rental_request_id', requestId)
          .order('created_at', { ascending: true }),
      ])

      if (!reqData) { router.push('/dashboard'); return }

      // Access check: must be renter or cat owner
      const isRenter = reqData.renter_id === user.id
      const isOwner = reqData.cats?.owner_id === user.id
      if (!isRenter && !isOwner) { router.push('/dashboard'); return }

      setRequestInfo(reqData as RequestInfo)
      setMessages(msgs || [])
      setLoading(false)
    }
    init()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `rental_request_id=eq.${requestId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(full_name)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              // deduplicate by id
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  useEffect(() => {
    if (!loading) scrollToBottom()
  }, [messages, loading])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !currentUserId || sending) return

    setSending(true)
    setInput('')
    await supabase.from('messages').insert({
      rental_request_id: requestId,
      sender_id: currentUserId,
      content: text,
    })
    setSending(false)
    inputRef.current?.focus()
  }

  const otherName = requestInfo
    ? currentUserId === requestInfo.renter_id
      ? requestInfo.cats?.profiles?.full_name ?? 'Хозяин'
      : requestInfo.profiles?.full_name ?? 'Арендатор'
    : ''

  const statusLabel: Record<string, string> = {
    pending: 'На рассмотрении',
    approved: 'Одобрена',
    rejected: 'Отклонена',
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-16 bg-zinc-50 rounded-2xl animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-10 bg-zinc-100 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 80px - 64px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 flex-shrink-0">
        <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
          {requestInfo?.cats?.photo_url ? (
            <Image src={requestInfo.cats.photo_url} alt={requestInfo.cats.name} width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <CatIcon className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 leading-none">{requestInfo?.cats?.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{requestInfo?.cats?.breed} · {otherName}</p>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
          requestInfo?.status === 'approved'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : requestInfo?.status === 'rejected'
            ? 'bg-red-50 text-red-600 border border-red-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {statusLabel[requestInfo?.status ?? 'pending']}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
              <CatIcon className="w-7 h-7 text-orange-300" strokeWidth={1.5} />
            </div>
            <p className="text-zinc-500 font-medium">Начните разговор</p>
            <p className="text-zinc-400 text-sm">Напишите первое сообщение {otherName}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const prevMsg = messages[i - 1]
              const showName = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
              const showTime = !messages[i + 1] || messages[i + 1].sender_id !== msg.sender_id

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showName && (
                    <p className="text-xs text-zinc-400 px-1 mb-1">{msg.profiles?.full_name ?? otherName}</p>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-br-sm'
                        : 'bg-zinc-100 text-zinc-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {showTime && (
                    <p className="text-[10px] text-zinc-300 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-zinc-100 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Сообщение для ${otherName}...`}
          className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!input.trim() || sending}
          className="h-11 w-11 p-0 bg-orange-500 hover:bg-orange-600 active:scale-[0.95] transition-all rounded-xl flex-shrink-0 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
