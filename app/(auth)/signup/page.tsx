'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cat, Home, User, ArrowRight, ArrowLeft, Check } from 'lucide-react'

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
    <div className="min-h-[calc(100dvh-80px)] grid grid-cols-1 lg:grid-cols-2 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Left: decorative */}
      <div className="hidden lg:flex flex-col justify-between bg-orange-500 p-12">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Cat className="w-5 h-5" />
          CatRent
        </Link>

        <div>
          <p className="text-orange-100 text-sm font-semibold uppercase tracking-widest mb-4">Как это работает</p>
          <div className="flex flex-col gap-5">
            {[
              { n: '01', text: 'Выберите роль — арендатор или хозяин' },
              { n: '02', text: 'Заполните профиль — имя и контакты' },
              { n: '03', text: 'Начните находить котов или принимать заявки' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-4">
                <span className="text-2xl font-bold text-white/30 leading-none">{n}</span>
                <p className="text-white font-medium leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-orange-200 text-sm">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-white font-semibold underline underline-offset-2">Войти</Link>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <div className={`flex-1 h-0.5 transition-all ${step > 1 ? 'bg-orange-500' : 'bg-zinc-100'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
              2
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">Кто вы?</h1>
                <p className="text-zinc-500">Выберите роль для начала работы</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {([
                  { value: 'renter', label: 'Арендатор', desc: 'Хочу взять кота', icon: User },
                  { value: 'owner', label: 'Хозяин', desc: 'Сдаю кота', icon: Home },
                ] as const).map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                      role === value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-zinc-100 hover:border-zinc-200 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${role === value ? 'bg-orange-500' : 'bg-zinc-100'}`}>
                      <Icon className={`w-4 h-4 ${role === value ? 'text-white' : 'text-zinc-400'}`} />
                    </div>
                    <p className="font-semibold text-sm text-zinc-900">{label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all gap-2"
              >
                Продолжить <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">Ваши данные</h1>
                <p className="text-zinc-500">Заполните профиль для завершения</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-zinc-700 text-sm font-medium">Ваше имя</Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Иван Иванов" required className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-zinc-700 text-sm font-medium">Email</Label>
                  <Input
                    type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com" required className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-zinc-700 text-sm font-medium">Пароль</Label>
                  <Input
                    type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Минимум 6 символов" minLength={6} required className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-zinc-700 text-sm font-medium">
                    Телефон <span className="text-zinc-400 font-normal">(необязательно)</span>
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67" className="h-11"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <Button
                    type="button" variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-1.5 text-zinc-600"
                  >
                    <ArrowLeft className="w-4 h-4" /> Назад
                  </Button>
                  <Button
                    type="submit" disabled={loading}
                    className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all gap-2"
                  >
                    {loading ? 'Регистрируем...' : (<>Зарегистрироваться <ArrowRight className="w-4 h-4" /></>)}
                  </Button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-zinc-500 mt-6 lg:hidden">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-orange-500 font-medium">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
