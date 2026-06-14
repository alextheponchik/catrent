'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cat, Home, User } from 'lucide-react'

type Role = 'owner' | 'renter'

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>('renter')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, role, phone: form.phone },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        full_name: form.full_name,
        phone: form.phone,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-4">
            <Cat className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-gray-500 mt-1">Шаг {step} из 2</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-4">Кто вы?</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'renter', label: 'Арендатор', desc: 'Хочу взять кота', icon: User },
                  { value: 'owner', label: 'Хозяин', desc: 'Сдаю кота', icon: Home },
                ] as const).map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${role === value ? 'text-orange-500' : 'text-gray-400'}`} />
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
              >
                Продолжить
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Ваше имя *</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Иван Иванов" required />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" required />
              </div>
              <div>
                <Label>Пароль *</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Минимум 6 символов" minLength={6} required />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67" />
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Назад</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
