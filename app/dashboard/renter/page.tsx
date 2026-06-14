'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import FilterBar from '@/components/FilterBar'
import { ClipboardList } from 'lucide-react'

interface Filters { breed: string; maxAge: number; maxPrice: number; search: string }

const statusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Одобрена', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонена', color: 'bg-red-100 text-red-700' },
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

  if (loading) return <div className="text-center py-16 text-gray-400">Загружаем...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Каталог котов</h1>
        <p className="text-gray-500 text-sm">{cats.length} доступных питомцев</p>
      </div>

      <FilterBar onFilter={fetchCats} />

      {cats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">По вашему запросу котов не найдено. Попробуйте изменить фильтры.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {cats.map(cat => <CatCard key={cat.id} cat={cat} />)}
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Мои заявки</h2>
          </div>
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                {req.cats?.photo_url && (
                  <img src={req.cats.photo_url} alt={req.cats.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{req.cats?.name}</p>
                  <p className="text-sm text-gray-400">{req.cats?.breed}</p>
                  <p className="text-xs text-gray-400">{new Date(req.requested_date).toLocaleDateString('ru-RU')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusLabel[req.status].color}`}>
                  {statusLabel[req.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
