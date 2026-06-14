'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import AddCatForm from '@/components/AddCatForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, ClipboardList } from 'lucide-react'

export default function OwnerDashboard() {
  const [cats, setCats] = useState<Cat[]>([])
  const [requests, setRequests] = useState<RentalRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: catsData }, { data: reqData }] = await Promise.all([
      supabase.from('cats').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('rental_requests')
        .select('*, cats(name), profiles(full_name, phone)')
        .in('cat_id', (await supabase.from('cats').select('id').eq('owner_id', user.id)).data?.map(c => c.id) || [])
        .order('requested_date', { ascending: false }),
    ])

    setCats(catsData || [])
    setRequests(reqData || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleAvailable = async (id: string, current: boolean) => {
    await supabase.from('cats').update({ is_available: !current }).eq('id', id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить кота из списка?')) return
    await supabase.from('cats').delete().eq('id', id)
    fetchData()
  }

  const handleRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('rental_requests').update({ status }).eq('id', id)
    fetchData()
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Одобрена', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Отклонена', color: 'bg-red-100 text-red-700' },
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Загружаем...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои коты</h1>
          <p className="text-gray-500 text-sm mt-1">{cats.length} питомцев в вашем профиле</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Добавить кота
        </Button>
      </div>

      {cats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-gray-500">У вас ещё нет котов.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-orange-500 hover:bg-orange-600">
            Добавить первого кота
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {cats.map(cat => (
            <CatCard
              key={cat.id} cat={cat} showActions
              onToggleAvailable={handleToggleAvailable}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Заявки на аренду</h2>
          </div>
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {req.cats?.name} — <span className="text-gray-500 font-normal">{req.profiles?.full_name}</span>
                  </p>
                  {req.profiles?.phone && <p className="text-sm text-gray-400">{req.profiles.phone}</p>}
                  {req.message && <p className="text-sm text-gray-600 mt-1 italic">«{req.message}»</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(req.requested_date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusLabel[req.status].color}`}>
                    {statusLabel[req.status].label}
                  </span>
                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleRequestStatus(req.id, 'approved')}
                        className="bg-green-500 hover:bg-green-600 h-7 text-xs">Одобрить</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRequestStatus(req.id, 'rejected')}
                        className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50">Отклонить</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить кота</DialogTitle>
          </DialogHeader>
          <AddCatForm onSuccess={() => { setShowForm(false); fetchData() }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
