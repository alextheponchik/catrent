'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { ArrowLeft, Send, Cat as CatIcon } from 'lucide-react'

interface RequestInfo {
  id: string
  renter_id: string
  status: string
  rental_days: number
  cats: { id: string; name: string; breed: string; photo_url?: string; owner_id: string } | null
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

interface Props {
  requestId: string
  onBack?: () => void
}

export default function ChatPane({ requestId, onBack }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null)
  const [renterName, setRenterName] = useState('Арендатор')
  const [ownerName, setOwnerName] = useState('Хозяин')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentUserIdRef = useRef<string | null>(null)
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
    setLoading(true)
    setMessages([])
    setRequestInfo(null)

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      currentUserIdRef.current = user.id

      const [{ data: reqData }, { data: msgs }] = await Promise.all([
        supabase.from('rental_requests')
          .select('id, renter_id, status, rental_days, cats(id, name, breed, photo_url, owner_id)')
          .eq('id', requestId)
          .single(),
        supabase.from('messages')
          .select('*, profiles(full_name)')
          .eq('rental_request_id', requestId)
          .order('created_at', { ascending: true }),
      ])

      if (!reqData) {
        if (onBack) onBack(); else router.push('/dashboard')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catsData = (Array.isArray((reqData as any).cats) ? (reqData as any).cats[0] : (reqData as any).cats) as RequestInfo['cats']

      const isRenter = reqData.renter_id === user.id
      const isOwner = catsData?.owner_id === user.id
      if (!isRenter && !isOwner) {
        if (onBack) onBack(); else router.push('/dashboard')
        return
      }

      setRequestInfo({ ...reqData, cats: catsData } as RequestInfo)
      setMessages(msgs || [])

      const ownerPromise = catsData?.owner_id
        ? supabase.from('profiles').select('full_name').eq('id', catsData.owner_id).single()
        : Promise.resolve({ data: null, error: null })

      const [{ data: ownerProfile }, { data: renterProfile }] = await Promise.all([
        ownerPromise,
        supabase.from('profiles').select('full_name').eq('id', reqData.renter_id).single(),
      ])
      if (ownerProfile?.full_name) setOwnerName(ownerProfile.full_name)
      if (renterProfile?.full_name) setRenterName(renterProfile.full_name)

      setLoading(false)
      markAsRead(user.id)
    }
    init()

    const channel = supabase
      .channel(`chatpane-${requestId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `rental_request_id=eq.${requestId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages').select('*, profiles(full_name)').eq('id', payload.new.id).single()
          if (data) {
            setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
            if (currentUserIdRef.current) markAsRead(currentUserIdRef.current)
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
    ? currentUserId === requestInfo.renter_id ? ownerName : renterName
    : ''

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-14 bg-teal-100 dark:bg-teal-900/40 rounded-2xl animate-pulse m-4" />
        <div className="flex-1 px-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-10 bg-teal-100 dark:bg-teal-900/40 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-teal-100 dark:border-teal-800/40 flex-shrink-0 bg-white/60 dark:bg-teal-950/60 backdrop-blur-sm">
        <button
          onClick={() => { if (onBack) onBack(); else router.push('/chat') }}
          className="text-teal-400 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-teal-100 dark:bg-teal-800/40 flex-shrink-0 flex items-center justify-center">
          {requestInfo?.cats?.photo_url ? (
            <Image src={requestInfo.cats.photo_url} alt={requestInfo.cats.name} width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <CatIcon className="w-4 h-4 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-teal-900 dark:text-white leading-none text-sm">{requestInfo?.cats?.name}</p>
          <p className="text-xs text-teal-400 dark:text-teal-500 mt-0.5 truncate">
            {otherName} · {rentalLabel(requestInfo?.rental_days ?? 1)}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
          requestInfo?.status === 'approved'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900'
            : requestInfo?.status === 'rejected'
            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900'
        }`}>
          {statusLabel[requestInfo?.status ?? 'pending']}
        </span>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center">
              <CatIcon className="w-6 h-6 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
            </div>
            <p className="text-teal-600 dark:text-teal-400 font-medium text-sm">Начните разговор</p>
            <p className="text-teal-400 dark:text-teal-500 text-xs">Напишите первое сообщение для {otherName}</p>
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
                    <p className="text-xs text-teal-400 dark:text-teal-500 px-1 mb-1">
                      {msg.profiles?.full_name ?? otherName}
                    </p>
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

      {/* Ввод */}
      <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t border-teal-100 dark:border-teal-800/40 flex-shrink-0 bg-white/60 dark:bg-teal-950/60 backdrop-blur-sm">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Сообщение для ${otherName}...`}
          className="flex-1 h-10 px-4 rounded-xl border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="h-10 w-10 p-0 bg-teal-600 hover:bg-teal-700 active:scale-[0.95] transition-all rounded-xl flex-shrink-0 disabled:opacity-40 border-0 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
