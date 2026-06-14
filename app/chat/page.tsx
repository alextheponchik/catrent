'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Cat as CatIcon, MessageCircle } from 'lucide-react'
import ChatPane from '@/components/ChatPane'

type ConvItem = {
  requestId: string
  catName: string
  catBreed: string
  catPhotoUrl: string | null
  catOwnerId: string
  renterId: string
  otherName: string
  lastMessage: string | null
  lastMessageAt: string | null
  unread: boolean
  status: string
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<ConvItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUserId(user.id)

    // Запросы где пользователь — арендатор
    const { data: renterReqs } = await supabase
      .from('rental_requests')
      .select('id, renter_id, status, cats(id, name, breed, photo_url, owner_id)')
      .eq('renter_id', user.id)

    // Запросы где пользователь — хозяин
    const { data: ownerCats } = await supabase.from('cats').select('id').eq('owner_id', user.id)
    const ownerCatIds = (ownerCats || []).map((c: any) => c.id)
    const ownerReqs = ownerCatIds.length > 0
      ? (await supabase.from('rental_requests')
          .select('id, renter_id, status, cats(id, name, breed, photo_url, owner_id)')
          .in('cat_id', ownerCatIds)).data ?? []
      : []

    // Дедупликация
    const seen = new Set<string>()
    const allReqs = [...(renterReqs || []), ...ownerReqs].filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    if (allReqs.length === 0) { setLoading(false); return }

    const reqIds = allReqs.map(r => r.id)

    const [{ data: msgs }, { data: reads }] = await Promise.all([
      supabase.from('messages')
        .select('rental_request_id, content, created_at, sender_id')
        .in('rental_request_id', reqIds)
        .order('created_at', { ascending: false }),
      supabase.from('conversation_reads')
        .select('rental_request_id, last_read_at')
        .eq('user_id', user.id)
        .in('rental_request_id', reqIds),
    ])

    // Последнее сообщение по каждому диалогу
    const lastMsgMap = new Map<string, { content: string; created_at: string; sender_id: string }>()
    for (const msg of msgs || []) {
      if (!lastMsgMap.has(msg.rental_request_id)) lastMsgMap.set(msg.rental_request_id, msg)
    }
    const readMap = new Map((reads || []).map((r: any) => [r.rental_request_id, r.last_read_at]))

    // Профили «другого» участника
    const profileIds = new Set<string>()
    for (const req of allReqs) {
      const cats = (Array.isArray((req as any).cats) ? (req as any).cats[0] : (req as any).cats) as any
      if (cats?.owner_id && cats.owner_id !== user.id) profileIds.add(cats.owner_id)
      if (req.renter_id !== user.id) profileIds.add(req.renter_id)
    }
    const { data: profilesData } = profileIds.size > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', Array.from(profileIds))
      : { data: [] }
    const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.full_name as string]))

    const convs: ConvItem[] = allReqs.map(req => {
      const cats = (Array.isArray((req as any).cats) ? (req as any).cats[0] : (req as any).cats) as any
      const lastMsg = lastMsgMap.get(req.id)
      const lastRead = readMap.get(req.id) as string | undefined
      const unread = !!lastMsg && lastMsg.sender_id !== user.id && (!lastRead || lastMsg.created_at > lastRead)
      const isOwner = cats?.owner_id === user.id
      const otherPersonId = isOwner ? req.renter_id : cats?.owner_id
      const otherName = profileMap.get(otherPersonId ?? '') ?? (isOwner ? 'Арендатор' : 'Хозяин')

      return {
        requestId: req.id,
        catName: cats?.name ?? 'Кот',
        catBreed: cats?.breed ?? '',
        catPhotoUrl: cats?.photo_url ?? null,
        catOwnerId: cats?.owner_id ?? '',
        renterId: req.renter_id,
        otherName,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        unread,
        status: req.status,
      }
    }).sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return b.lastMessageAt.localeCompare(a.lastMessageAt)
    })

    setConversations(convs)
    if (!selectedId && convs.length > 0) setSelectedId(convs[0].requestId)
    setLoading(false)
  }, [])

  useEffect(() => { loadConversations() }, [])

  // Обновление списка при новых сообщениях
  useEffect(() => {
    const channel = supabase
      .channel('chat-list-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadConversations])

  const formatTime = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'только что'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин`
    if (diff < 86_400_000) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      className="flex -mx-4 sm:-mx-6 lg:-mx-8 -mb-8"
      style={{ height: 'calc(100dvh - 64px)' }}
    >
      {/* Левая панель — список диалогов */}
      <div className={`
        ${selectedId ? 'hidden md:flex' : 'flex'} flex-col
        w-full md:w-80 lg:w-96 flex-shrink-0
        border-r border-teal-100 dark:border-teal-800/40
        bg-white dark:bg-teal-950/80
      `}>
        <div className="px-4 py-4 border-b border-teal-100 dark:border-teal-800/40 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-teal-900 dark:text-white">Чаты</h1>
            {conversations.filter(c => c.unread).length > 0 && (
              <span className="ml-auto min-w-[20px] h-5 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                {conversations.filter(c => c.unread).length}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-teal-100 dark:bg-teal-900/40 rounded w-2/3" />
                    <div className="h-3 bg-teal-100 dark:bg-teal-900/40 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center">
                <CatIcon className="w-7 h-7 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
              </div>
              <p className="text-teal-600 dark:text-teal-400 font-medium">Диалогов пока нет</p>
              <p className="text-teal-400 dark:text-teal-500 text-sm">Они появятся после подачи заявки на аренду кота</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.requestId}
                onClick={() => setSelectedId(conv.requestId)}
                className={`w-full px-4 py-3.5 flex items-start gap-3 transition-colors text-left border-b border-teal-50 dark:border-teal-900/50 cursor-pointer
                  ${selectedId === conv.requestId
                    ? 'bg-teal-50 dark:bg-teal-900/40'
                    : 'hover:bg-teal-50/70 dark:hover:bg-teal-900/30'}`}
              >
                {/* Фото кота */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-teal-100 dark:bg-teal-800/40 flex-shrink-0 flex items-center justify-center">
                  {conv.catPhotoUrl ? (
                    <Image src={conv.catPhotoUrl} alt={conv.catName} fill className="object-cover" sizes="48px" />
                  ) : (
                    <CatIcon className="w-5 h-5 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
                  )}
                  {conv.unread && (
                    <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-teal-600 rounded-full border-2 border-white dark:border-teal-950" />
                  )}
                </div>

                {/* Текст */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <p className={`text-sm truncate ${conv.unread ? 'font-bold text-teal-900 dark:text-white' : 'font-semibold text-teal-800 dark:text-teal-100'}`}>
                      {conv.catName}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-teal-300 dark:text-teal-600 flex-shrink-0">{formatTime(conv.lastMessageAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-teal-500 dark:text-teal-400 truncate">{conv.otherName}</p>
                  {conv.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unread ? 'text-teal-700 dark:text-teal-300 font-medium' : 'text-teal-400 dark:text-teal-500'}`}>
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Правая панель — чат */}
      <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-teal-50/30 dark:bg-teal-950/30 overflow-hidden`}>
        {selectedId ? (
          <ChatPane
            key={selectedId}
            requestId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
            </div>
            <p className="text-teal-600 dark:text-teal-400 font-medium">Выберите диалог</p>
            <p className="text-teal-400 dark:text-teal-500 text-sm">Нажмите на контакт слева, чтобы открыть чат</p>
          </div>
        )}
      </div>
    </div>
  )
}
