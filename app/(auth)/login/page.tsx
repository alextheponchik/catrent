'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cat, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Неверный email или пароль')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] grid grid-cols-1 lg:grid-cols-2 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">

      {/* Left — orange, same as signup */}
      <div className="hidden lg:flex flex-col justify-between bg-orange-500 p-12">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Cat className="w-5 h-5" />
          CatRent
        </Link>

        <div>
          <p className="text-3xl font-bold text-white leading-snug mb-3">
            Рады видеть<br />вас снова
          </p>
          <p className="text-orange-100 leading-relaxed">
            Войдите, чтобы найти нового пушистого друга или проверить заявки на аренду.
          </p>
        </div>

        <div className="text-orange-200 text-sm">
          Нет аккаунта?{' '}
          <Link href="/signup" className="text-white font-semibold underline underline-offset-2">
            Зарегистрироваться
          </Link>
        </div>
      </div>

      {/* Right — white, form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-zinc-950 tracking-tight mb-1">
              Вход в аккаунт
            </h1>
            <p className="text-zinc-400">Введите ваши данные ниже</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-zinc-700 text-sm font-medium">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="h-11 rounded-xl border-zinc-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-zinc-700 text-sm font-medium">Пароль</Label>
              <Input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="h-11 rounded-xl border-zinc-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit" disabled={loading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all gap-2 rounded-xl text-base font-semibold mt-1"
            >
              {loading ? 'Входим...' : (
                <>Войти <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-8 lg:hidden">
            Нет аккаунта?{' '}
            <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
