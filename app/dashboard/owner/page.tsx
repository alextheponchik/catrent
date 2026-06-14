'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat, RentalRequest } from '@/types'
import CatCard from '@/components/CatCard'
import AddCatForm from '@/components/AddCatForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, ClipboardList, Cat as CatIcon, Check, X, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Ожидает',  cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900' },
  approved: { label: 'Одобрена', cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900' },
  rejected: { label: 'Отклонена', cls: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900' },
}

const rentalLabel = (days: number) => {
  if (days === 1) return '1 день'
  if (days === 3) return '3 дня'
  if (days === 7) return '1 неделя'
  if (days === 14) return '2 недели'
  if (days === 30) return '1 месяц'
  return `${days} дн.`
}

export default function OwnerDashboard() {
  const [cats, setCats] = useState<Cat[]>([])
  const [requests, setRequests] = useState<RentalRequest[]>([])
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: catsData } = await supabase.from('cats').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setCats(catsData || [])

    const catIds = catsData?.map(c => c.id) || []

    if (catIds.length === 0) {
      setRequests([])
      setUnreadSet(new Set())
      setLoading(false)
      return
    }

    const [{ data: reqData }, { data: reads }, { data: latestMsgs }] = await Promise.all([
      supabase.from('rental_requests')
        .select('*, cats(name), profiles(full_name, phone)')
        .in('cat_id', catIds)
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
            <div className="h-7 bg-teal-100 dark:bg-teal-900/40 rounded-lg w-32 animate-pulse" />
            <div className="h-4 bg-teal-100 dark:bg-teal-900/40 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-teal-100 dark:bg-teal-900/40 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-teal-950/60 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-teal-100 dark:bg-teal-900/40" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-teal-100 dark:bg-teal-900/40 rounded w-2/3" />
                <div className="h-3 bg-teal-100 dark:bg-teal-900/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Мои питомцы</p>
          <h1 className="text-3xl font-bold text-teal-950 dark:text-white tracking-tight">
            {cats.length > 0 ? `${cats.length} кот${cats.length === 1 ? '' : cats.length < 5 ? 'а' : 'ов'}` : 'Мои коты'}
          </h1>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 active:scale-[0.97] transition-all gap-2 rounded-xl h-10 font-semibold border-0"
        >
          <Plus className="w-4 h-4" /> Добавить кота
        </Button>
      </div>

      {cats.length === 0 ? (
        <div className="text-center py-24 bg-teal-50 dark:bg-teal-950/40 rounded-3xl border-2 border-dashed border-teal-200 dark:border-teal-800/50">
          <div className="w-16 h-16 bg-white dark:bg-teal-900/40 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-teal-100 dark:border-teal-800/40 shadow-sm">
            <CatIcon className="w-8 h-8 text-teal-300 dark:text-teal-600" strokeWidth={1.5} />
          </div>
          <p className="text-teal-600 dark:text-teal-400 font-semibold text-lg mb-1">У вас ещё нет котов</p>
          <p className="text-teal-400 dark:text-teal-500 text-sm mb-6">Добавьте питомца, чтобы получать заявки</p>
          <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700 active:scale-[0.97] transition-all rounded-xl font-semibold border-0">
            Добавить первого кота
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-14">
          {cats.map(cat => (
            <CatCard key={cat.id} cat={cat} showActions onToggleAvailable={handleToggleAvailable} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="border-t border-teal-100 dark:border-teal-800/40 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-teal-100 dark:bg-teal-800/40 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-950 dark:text-white tracking-tight">Заявки на аренду</h2>
              <p className="text-xs text-teal-400 dark:text-teal-500">{requests.filter(r => (r as any).status === 'pending').length} ожидают решения</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] || statusConfig.pending
              const hasUnread = unreadSet.has(req.id)
              return (
                <div key={req.id} className="bg-white dark:bg-teal-950/60 rounded-2xl border border-teal-100 dark:border-teal-800/30 hover:border-teal-200 dark:hover:border-teal-700 transition-colors p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-teal-900 dark:text-white truncate">{req.cats?.name}</p>
                      <span className="text-teal-200 dark:text-teal-700">·</span>
                      <p className="text-teal-500 dark:text-teal-400 text-sm truncate">{req.profiles?.full_name}</p>
                    </div>
                    {req.profiles?.phone && (
                      <p className="text-sm text-teal-400 dark:text-teal-500 mb-1">{req.profiles.phone}</p>
                    )}
                    <p className="text-xs text-teal-400 dark:text-teal-500 mb-1">
                      Срок: <span className="font-medium text-teal-600 dark:text-teal-400">{rentalLabel(req.rental_days ?? 1)}</span>
                    </p>
                    {req.message && (
                      <p className="text-sm text-teal-500 dark:text-teal-400 italic bg-teal-50 dark:bg-teal-900/40 px-3 py-1.5 rounded-lg mb-2">
                        &laquo;{req.message}&raquo;
                      </p>
                    )}
                    <p className="text-xs text-teal-300 dark:text-teal-600">
                      {new Date(req.requested_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    <Link
                      href={`/chat/${req.id}`}
                      className="relative w-8 h-8 bg-teal-50 dark:bg-teal-900/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 active:scale-[0.95] text-teal-600 dark:text-teal-500 rounded-xl flex items-center justify-center transition-all"
                      title="Написать арендатору"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-600 rounded-full border-2 border-white dark:border-teal-950" />
                      )}
                    </Link>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleRequestStatus(req.id, 'approved')}
                          className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.95] text-white rounded-xl flex items-center justify-center transition-all" title="Одобрить">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRequestStatus(req.id, 'rejected')}
                          className="w-8 h-8 bg-teal-100 dark:bg-teal-800/40 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 active:scale-[0.95] text-teal-400 dark:text-teal-500 rounded-xl flex items-center justify-center transition-all" title="Отклонить">
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
        <DialogContent className="max-w-lg dark:bg-teal-950 dark:border-teal-800/50">
          <DialogHeader>
            <DialogTitle className="text-teal-950 dark:text-white">Добавить кота</DialogTitle>
          </DialogHeader>
          <AddCatForm onSuccess={() => { setShowForm(false); fetchData() }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
