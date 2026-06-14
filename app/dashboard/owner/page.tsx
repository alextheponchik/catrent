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

    const catIds = (await supabase.from('cats').select('id').eq('owner_id', user.id)).data?.map(c => c.id) || []

    const [{ data: catsData }, { data: reqData }, { data: reads }, { data: latestMsgs }] = await Promise.all([
      supabase.from('cats').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
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

    setCats(catsData || [])
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
            <div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-32 animate-pulse" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
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
          <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Мои питомцы</p>
          <h1 className="text-3xl font-bold text-zinc-950 dark:text-white tracking-tight">
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

      {cats.length === 0 ? (
        <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-zinc-100 dark:border-zinc-700 shadow-sm">
            <CatIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-lg mb-1">У вас ещё нет котов</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-6">Добавьте питомца, чтобы получать заявки</p>
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-all rounded-xl font-semibold">
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
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">Заявки на аренду</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{requests.filter(r => (r as any).status === 'pending').length} ожидают решения</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] || statusConfig.pending
              const hasUnread = unreadSet.has(req.id)
              return (
                <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">{req.cats?.name}</p>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{req.profiles?.full_name}</p>
                    </div>
                    {req.profiles?.phone && (
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-1">{req.profiles.phone}</p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                      Срок: <span className="font-medium text-zinc-600 dark:text-zinc-400">{rentalLabel(req.rental_days ?? 1)}</span>
                    </p>
                    {req.message && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg mb-2">
                        &laquo;{req.message}&raquo;
                      </p>
                    )}
                    <p className="text-xs text-zinc-300 dark:text-zinc-600">
                      {new Date(req.requested_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    <Link
                      href={`/chat/${req.id}`}
                      className="relative w-8 h-8 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/60 active:scale-[0.95] text-orange-500 dark:text-orange-400 rounded-xl flex items-center justify-center transition-all"
                      title="Написать арендатору"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-900" />
                      )}
                    </Link>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleRequestStatus(req.id, 'approved')}
                          className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.95] text-white rounded-xl flex items-center justify-center transition-all" title="Одобрить">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRequestStatus(req.id, 'rejected')}
                          className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 active:scale-[0.95] text-zinc-400 dark:text-zinc-500 rounded-xl flex items-center justify-center transition-all" title="Отклонить">
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
        <DialogContent className="max-w-lg dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white">Добавить кота</DialogTitle>
          </DialogHeader>
          <AddCatForm onSuccess={() => { setShowForm(false); fetchData() }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
