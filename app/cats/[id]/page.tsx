'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Cat, Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Banknote, UtensilsCrossed, User, CheckCircle, Cat as CatIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CatPage() {
  const { id } = useParams<{ id: string }>()
  const [cat, setCat] = useState<Cat | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: catData }, { data: { user } }] = await Promise.all([
        supabase.from('cats').select('*, profiles(*)').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      setCat(catData)
      if (catData?.profiles) setProfile(catData.profiles as any)

      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(data?.role || null)

        const { data: existing } = await supabase.from('rental_requests')
          .select('id').eq('cat_id', id).eq('renter_id', user.id).single()
        if (existing) setSubmitted(true)
      }
    }
    load()
  }, [id])

  const handleRequest = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('rental_requests').insert({
      cat_id: id,
      renter_id: user.id,
      message,
      requested_date: new Date().toISOString(),
    })

    setSubmitted(true)
    setShowDialog(false)
    setSubmitting(false)
  }

  const ageLabel = cat ? (cat.age_months >= 12
    ? `${Math.floor(cat.age_months / 12)} лет`
    : `${cat.age_months} мес.`) : ''

  if (!cat) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="aspect-square bg-zinc-100" />
            <div className="p-8 space-y-4">
              <div className="h-8 bg-zinc-100 rounded-lg w-1/2" />
              <div className="h-4 bg-zinc-100 rounded w-1/3" />
              <div className="space-y-3 mt-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-zinc-100 rounded" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к каталогу
      </Link>

      <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photo */}
          <div className="relative bg-zinc-50" style={{ minHeight: '360px' }}>
            {cat.photo_url ? (
              <Image src={cat.photo_url} alt={cat.name} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <CatIcon className="w-20 h-20 text-zinc-200" strokeWidth={1} />
              </div>
            )}
            {!cat.is_available && (
              <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
                <span className="bg-white text-zinc-800 text-sm font-semibold px-4 py-2 rounded-full">
                  Недоступен
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-0.5">{cat.name}</h1>
                <p className="text-zinc-400">{cat.breed}</p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <InfoRow icon={Calendar} label={`Возраст: ${ageLabel}`} />
                <InfoRow icon={Banknote} label={`${cat.price_per_day} ₽ в день`} bold />
                <InfoRow icon={UtensilsCrossed} label={cat.feeding_requirements} />
                {profile && <InfoRow icon={User} label={`Хозяин: ${profile.full_name}`} />}
              </div>
            </div>

            <div>
              {cat.is_available && userRole === 'renter' && (
                submitted ? (
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3.5 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Заявка отправлена</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Ждите ответа хозяина</p>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowDialog(true)}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white transition-all text-base font-semibold"
                  >
                    Запросить аренду
                  </Button>
                )
              )}

              {!userRole && cat.is_available && (
                <Link href="/signup">
                  <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all text-base font-semibold">
                    Войдите, чтобы арендовать
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Запрос на аренду — {cat.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-zinc-500">Оставьте сообщение хозяину (необязательно):</p>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Расскажите о себе и когда хотите взять кота..."
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Отмена
              </Button>
              <Button
                onClick={handleRequest} disabled={submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all"
              >
                {submitting ? 'Отправляем...' : 'Отправить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon: Icon, label, bold }: { icon: React.ElementType; label: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-orange-500" />
      </div>
      <span className={`text-sm leading-relaxed ${bold ? 'font-semibold text-zinc-900 text-base' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  )
}
