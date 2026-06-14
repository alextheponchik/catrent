'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import FilterBar from '@/components/FilterBar'
import { ClipboardList, Search, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Filters { breed: string; maxAge: number; maxPrice: number; search: string }

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'На рассмотрении', cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900' },
  approved: { label: 'Одобрена',        cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900' },
  rejected: { label: 'Отклонена',       cls: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900' },
}

const rentalLabel = (days: number) => {
  if (days === 1) return '1 день'
  if (days === 3) return '3 дня'
  if (days === 7) return '1 неделя'
  if (days === 14) return '2 недели'
  if (days === 30) return '1 месяц'
  return `${days} дн.`
}

export default function RenterDashboard() {
  const [cats, setCats] = useState<Cat[]>([])
  const [requests, setRequests] = useState<RentalRequest[]>([])
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCats = useCallback(async (filters: Filters = { breed: '', maxAge: 240, maxPrice: 5000, search: '' }) => {
    let query = supabase.from('cats').select('*, profiles(full_name)').eq('is_available', true)
    if (filters.breed) query = query.eq('breed', filters.breed)
    query = query.lte('age_months', filters.maxAge).lte('price_per_day', filters.maxPrice)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)
    const { data } = await query.order('created_at', { ascending: false })
    setCats(data || [])
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: reqData }, { data: reads }, { data: latestMsgs }] = await Promise.all([
          supabase.from('rental_requests')
            .select('*, cats(name, breed, photo_url)')
            .eq('renter_id', user.id)
            .order('requested_date', { ascending: false }),
          supabase.from('conversation_reads')
            .select('rental_request_id, last_read_at')
            .eq('user_id', user.id),
          supabase.from('messages')
            .select('rental_request_id, created_at')
            .neq('sender_id', user.id)
            .order('created_at', { ascending: false }),
        ])
        setRequests(reqData || [])

        // Build unread set
        const readMap = new Map(reads?.map(r => [r.rental_request_id, r.last_read_at]) ?? [])
        const newUnread = new Set<string>()
        const seen = new Set<string>()
        for (const msg of latestMsgs ?? []) {
          if (!seen.has(msg.rental_request_id)) {
            seen.add(msg.rental_request_id)
            const lastRead = readMap.get(msg.rental_request_id)
            if (!lastRead || msg.created_at > lastRead) newUnread.add(msg.rental_request_id)
          }
        }
        setUnreadSet(newUnread)
      }
      await fetchCats()
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Каталог</p>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Доступные коты</h1>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">{cats.length} питомцев</p>
        </div>
      </div>

      <FilterBar onFilter={fetchCats} />

      {cats.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
            <Search className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">По вашему запросу котов не найдено</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {cats.map(cat => <CatCard key={cat.id} cat={cat} />)}
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Мои заявки</h2>
          </div>
          <div className="flex flex-col gap-2">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] || statusConfig.pending
              const hasUnread = unreadSet.has(req.id)
              return (
                <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-4 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex-shrink-0">
                    {req.cats?.photo_url ? (
                      <Image src={req.cats.photo_url} alt={req.cats.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{req.cats?.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {req.cats?.breed} · {rentalLabel(req.rental_days ?? 1)} · {new Date(req.requested_date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    <Link
                      href={`/chat/${req.id}`}
                      className="relative w-8 h-8 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 active:scale-[0.95] text-violet-600 dark:text-violet-500 rounded-xl flex items-center justify-center transition-all"
                      title="Написать хозяину"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-violet-600 rounded-full border-2 border-white dark:border-zinc-900" />
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
