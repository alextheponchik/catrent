'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { ArrowLeft, Send, Cat as CatIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RequestInfo {
  id: string
  renter_id: string
  status: string
  rental_days: number
  cats: { id: string; name: string; breed: string; photo_url?: string; owner_id: string }
  profiles: { full_name: string }
}

const rentalLabel = (days: number) => {
  if (days === 1) return '1 день'
  if (days === 3) return '3 дня'
  if (days === 7) return '1 неделя'
  if (days === 14) return '2 недели'
  if (days === 30) return '1 месяц'
  return `${days} дн.`
}

const statusLabel: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
}

export default function ChatPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null)
  const [ownerName, setOwnerName] = useState('Хозяин')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const markAsRead = useCallback(async (userId: string) => {
    await supabase.from('conversation_reads').upsert(
      { rental_request_id: requestId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: 'rental_request_id,user_id' }
    )
  }, [requestId])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const [{ data: reqData }, { data: msgs }] = await Promise.all([
        supabase.from('rental_requests')
          .select('*, cats(id, name, breed, photo_url, owner_id), profiles(full_name)')
          .eq('id', requestId).single(),
        supabase.from('messages')
          .select('*, profiles(full_name)')
          .eq('rental_request_id', requestId)
          .order('created_at', { ascending: true }),
      ])

      if (!reqData) { router.push('/dashboard'); return }
      const isRenter = reqData.renter_id === user.id
      const isOwner = reqData.cats?.owner_id === user.id
      if (!isRenter && !isOwner) { router.push('/dashboard'); return }

      setRequestInfo(reqData as RequestInfo)
      setMessages(msgs || [])

      // Fetch owner's name separately to avoid nested FK join issues
      if (reqData.cats?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', reqData.cats.owner_id)
          .single()
        if (ownerProfile?.full_name) setOwnerName(ownerProfile.full_name)
      }

      setLoading(false)
      markAsRead(user.id)
    }
    init()

    const channel = supabase
      .channel(`chat-${requestId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `rental_request_id=eq.${requestId}` },
        async (payload) => {
          const { data } = await supabase.from('messages').select('*, profiles(full_name)').eq('id', payload.new.id).single()
          if (data) {
            setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
            setCurrentUserId(uid => { if (uid) markAsRead(uid); return uid })
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
    await supabase.from('messages').insert({ rental_request_id: requestId, sender_id: currentUserId, content: text })
    setSending(false)
    inputRef.current?.focus()
  }

  const otherName = requestInfo
    ? currentUserId === requestInfo.renter_id
      ? ownerName
      : requestInfo.profiles?.full_name ?? 'Арендатор'
    : ''

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 py-4">
        <div className="h-14 bg-teal-100 dark:bg-teal-900/40 rounded-2xl animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`h-10 bg-teal-100 dark:bg-teal-900/40 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 80px - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-teal-100 dark:border-teal-800/40 flex-shrink-0">
        <Link href="/dashboard" className="text-teal-400 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-100 dark:bg-teal-800/40 flex-shrink-0 flex items-center justify-center">
          {requestInfo?.cats?.photo_url ? (
            <Image src={requestInfo.cats.photo_url} alt={requestInfo.cats.name} width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <CatIcon className="w-5 h-5 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-teal-900 dark:text-white leading-none">{requestInfo?.cats?.name}</p>
          <p className="text-xs text-teal-400 dark:text-teal-500 mt-0.5">
            {requestInfo?.cats?.breed} · {otherName} · {rentalLabel(requestInfo?.rental_days ?? 1)}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
          requestInfo?.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900' :
          requestInfo?.status === 'rejected' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900' :
          'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900'
        }`}>
          {statusLabel[requestInfo?.status ?? 'pending']}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center">
              <CatIcon className="w-7 h-7 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
            </div>
            <p className="text-teal-600 dark:text-teal-400 font-medium">Начните разговор</p>
            <p className="text-teal-400 dark:text-teal-500 text-sm">Напишите первое сообщение {otherName}</p>
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
                    <p className="text-xs text-teal-400 dark:text-teal-500 px-1 mb-1">{msg.profiles?.full_name ?? otherName}</p>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-teal-50 dark:bg-teal-900/50 text-teal-900 dark:text-teal-100 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {showTime && (
                    <p className="text-[10px] text-teal-300 dark:text-teal-600 mt-1 px-1">
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
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-teal-100 dark:border-teal-800/40 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Сообщение для ${otherName}...`}
          className="flex-1 h-11 px-4 rounded-xl border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
          autoComplete="off"
        />
        <Button type="submit" disabled={!input.trim() || sending}
          className="h-11 w-11 p-0 bg-teal-600 hover:bg-teal-700 active:scale-[0.95] transition-all rounded-xl flex-shrink-0 disabled:opacity-40 border-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
