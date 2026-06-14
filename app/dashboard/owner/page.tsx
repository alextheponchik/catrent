'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import AddCatForm from '@/components/AddCatForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, ClipboardList, Cat as CatIcon, Check, X } from 'lucide-react'

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Ожидает',  cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  approved: { label: 'Одобрена', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  rejected: { label: 'Отклонена', cls: 'bg-red-50 text-red-600 border border-red-100' },
}

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

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-7 bg-zinc-100 rounded-lg w-32 animate-pulse" />
            <div className="h-4 bg-zinc-100 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-zinc-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-50 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-zinc-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-100 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Мои питомцы</p>
          <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">
            {cats.length > 0 ? `${cats.length} кот${cats.length === 1 ? '' : cats.length < 5 ? 'а' : 'ов'}` : 'Мои коты'}
          </h1>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-all gap-2 rounded-xl h-10 font-semibold"
        >
          <Plus className="w-4 h-4" /> Добавить кота
        </Button>
      </div>

      {/* Cats grid */}
      {cats.length === 0 ? (
        <div className="text-center py-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 border border-zinc-100 shadow-sm">
            <CatIcon className="w-8 h-8 text-zinc-300" strokeWidth={1.5} />
          </div>
          <p className="text-zinc-500 font-semibold text-lg mb-1">У вас ещё нет котов</p>
          <p className="text-zinc-400 text-sm mb-6">Добавьте питомца, чтобы получать заявки</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-all rounded-xl font-semibold"
          >
            Добавить первого кота
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-14">
          {cats.map(cat => (
            <CatCard
              key={cat.id} cat={cat} showActions
              onToggleAvailable={handleToggleAvailable}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Requests */}
      {requests.length > 0 && (
        <div className="border-t border-zinc-100 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Заявки на аренду</h2>
              <p className="text-xs text-zinc-400">{requests.filter(r => (r as any).status === 'pending').length} ожидают решения</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] || statusConfig.pending
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-zinc-900 truncate">{req.cats?.name}</p>
                      <span className="text-zinc-300">·</span>
                      <p className="text-zinc-500 text-sm truncate">{req.profiles?.full_name}</p>
                    </div>
                    {req.profiles?.phone && (
                      <p className="text-sm text-zinc-400 mb-1">{req.profiles.phone}</p>
                    )}
                    {req.message && (
                      <p className="text-sm text-zinc-500 italic bg-zinc-50 px-3 py-1.5 rounded-lg mb-2">
                        &laquo;{req.message}&raquo;
                      </p>
                    )}
                    <p className="text-xs text-zinc-300">
                      {new Date(req.requested_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRequestStatus(req.id, 'approved')}
                          className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.95] text-white rounded-xl flex items-center justify-center transition-all"
                          title="Одобрить"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestStatus(req.id, 'rejected')}
                          className="w-8 h-8 bg-zinc-100 hover:bg-red-50 hover:text-red-500 active:scale-[0.95] text-zinc-400 rounded-xl flex items-center justify-center transition-all"
                          title="Отклонить"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-950">Добавить кота</DialogTitle>
          </DialogHeader>
          <AddCatForm onSuccess={() => { setShowForm(false); fetchData() }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
