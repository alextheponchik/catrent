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
      options: { data: { full_name: form.full_name, role, phone: form.phone } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, role, full_name: form.full_name, phone: form.phone })
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 flex items-center justify-center px-4 py-12">
      <div className="absolute -top-20 right-0 w-96 h-96 bg-teal-400/25 rounded-full blur-3xl pointer-events-none translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
            <Cat className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-2xl font-extrabold text-white">CatRent</span>
        </Link>

        <div className="bg-white/95 dark:bg-teal-950/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-teal-900/30 border border-white/30 dark:border-teal-700/30">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm shadow-teal-300 dark:shadow-teal-900/50' : 'bg-teal-100 dark:bg-teal-800 text-teal-400'}`}>
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <div className={`flex-1 h-0.5 transition-all ${step > 1 ? 'bg-gradient-to-r from-teal-600 to-cyan-500' : 'bg-teal-100 dark:bg-teal-800'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm shadow-teal-300 dark:shadow-teal-900/50' : 'bg-teal-100 dark:bg-teal-800 text-teal-400'}`}>
              2
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-teal-900 dark:text-white tracking-tight mb-1">Кто вы?</h1>
                <p className="text-teal-400 dark:text-teal-400 text-sm">Выберите роль для начала работы</p>
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
                    className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] cursor-pointer ${
                      role === value
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                        : 'border-teal-100 dark:border-teal-800 hover:border-teal-200 dark:hover:border-teal-700 bg-white dark:bg-teal-950/40'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all ${role === value ? 'bg-gradient-to-br from-teal-600 to-cyan-600 shadow-sm shadow-teal-300 dark:shadow-teal-900/50' : 'bg-teal-100 dark:bg-teal-800'}`}>
                      <Icon className={`w-4 h-4 ${role === value ? 'text-white' : 'text-teal-400'}`} />
                    </div>
                    <p className="font-semibold text-sm text-teal-900 dark:text-teal-100">{label}</p>
                    <p className="text-xs text-teal-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 active:scale-[0.98] transition-all gap-2 font-semibold border-0 shadow-sm shadow-teal-300 dark:shadow-teal-900/50"
              >
                Продолжить <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-teal-900 dark:text-white tracking-tight mb-1">Ваши данные</h1>
                <p className="text-teal-400 text-sm">Заполните профиль для завершения</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-teal-700 dark:text-teal-300 text-sm font-medium">Ваше имя</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Иван Иванов" required className="h-11 border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 focus:border-teal-400 focus:ring-teal-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-teal-700 dark:text-teal-300 text-sm font-medium">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com" required className="h-11 border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 focus:border-teal-400 focus:ring-teal-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-teal-700 dark:text-teal-300 text-sm font-medium">Пароль</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Минимум 6 символов" minLength={6} required className="h-11 border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 focus:border-teal-400 focus:ring-teal-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-teal-700 dark:text-teal-300 text-sm font-medium">
                    Телефон <span className="text-teal-300 font-normal">(необязательно)</span>
                  </Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67" className="h-11 border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 focus:border-teal-400 focus:ring-teal-400" />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}
                    className="gap-1.5 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/40">
                    <ArrowLeft className="w-4 h-4" /> Назад
                  </Button>
                  <Button type="submit" disabled={loading}
                    className="flex-1 h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 active:scale-[0.98] transition-all gap-2 font-semibold border-0 shadow-sm shadow-teal-300 dark:shadow-teal-900/50">
                    {loading ? 'Регистрируем...' : (<>Зарегистрироваться <ArrowRight className="w-4 h-4" /></>)}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-teal-200/80 text-sm mt-6">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-white font-semibold hover:text-teal-100 transition-colors">Войти</Link>
        </p>
      </div>
    </div>
  )
}
