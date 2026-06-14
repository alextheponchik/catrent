'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import FilterBar from '@/components/FilterBar'
import { ClipboardList, Search } from 'lucide-react'
import Image from 'next/image'

interface Filters { breed: string; maxAge: number; maxPrice: number; search: string }

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'На рассмотрении', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  approved: { label: 'Одобрена',        cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  rejected: { label: 'Отклонена',       cls: 'bg-red-50 text-red-600 border border-red-100' },
}

export default function RenterDashboard() {
  const [cats, setCats] = useState<Cat[]>([])
  const [requests, setRequests] = useState<RentalRequest[]>([])
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
        const { data } = await supabase.from('rental_requests')
          .select('*, cats(name, breed, photo_url)')
          .eq('renter_id', user.id)
          .order('requested_date', { ascending: false })
        setRequests(data || [])
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
          <div key={i} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-zinc-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-zinc-100 rounded w-2/3" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Каталог</p>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Доступные коты</h1>
          <p className="text-zinc-400 text-sm">{cats.length} питомцев</p>
        </div>
      </div>

      <FilterBar onFilter={fetchCats} />

      {cats.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
          <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
            <Search className="w-6 h-6 text-zinc-300" />
          </div>
          <p className="text-zinc-500 font-medium">По вашему запросу котов не найдено</p>
          <p className="text-zinc-400 text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {cats.map(cat => <CatCard key={cat.id} cat={cat} />)}
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-8 pt-8 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-zinc-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Мои заявки</h2>
          </div>
          <div className="flex flex-col gap-2">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] || statusConfig.pending
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-4 hover:border-zinc-200 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0">
                    {req.cats?.photo_url ? (
                      <Image src={req.cats.photo_url} alt={req.cats.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-zinc-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{req.cats?.name}</p>
                    <p className="text-xs text-zinc-400">{req.cats?.breed} · {new Date(req.requested_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
