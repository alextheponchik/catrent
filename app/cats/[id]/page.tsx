'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Cat, Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, DollarSign, UtensilsCrossed, User } from 'lucide-react'
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

  if (!cat) return <div className="text-center py-16 text-gray-400">Загружаем...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Назад
      </Link>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative h-64 md:h-full min-h-[300px] bg-gradient-to-br from-orange-50 to-amber-50">
            {cat.photo_url ? (
              <Image src={cat.photo_url} alt={cat.name} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-8xl">🐱</div>
            )}
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
                <p className="text-gray-500">{cat.breed}</p>
              </div>
              {!cat.is_available && <Badge variant="secondary">Недоступен</Badge>}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Возраст: {ageLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-semibold text-gray-900">{cat.price_per_day} ₽ в день</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <UtensilsCrossed className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>{cat.feeding_requirements}</span>
              </div>
              {profile && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Хозяин: {profile.full_name}</span>
                </div>
              )}
            </div>

            {cat.is_available && userRole === 'renter' && (
              submitted ? (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                  ✓ Заявка отправлена! Ждите ответа хозяина.
                </div>
              ) : (
                <Button
                  onClick={() => setShowDialog(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="lg"
                >
                  Запросить аренду
                </Button>
              )
            )}

            {!userRole && cat.is_available && (
              <Link href="/signup">
                <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                  Войдите, чтобы арендовать
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запрос на аренду — {cat.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Оставьте сообщение хозяину (необязательно):</p>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Расскажите о себе и когда хотите взять кота..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Отмена</Button>
              <Button onClick={handleRequest} disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {submitting ? 'Отправляем...' : 'Отправить заявку'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
