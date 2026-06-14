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
      {/* Left: decorative */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Cat className="w-5 h-5 text-orange-400" />
          CatRent
        </Link>
        <div>
          <blockquote className="text-2xl font-medium text-white leading-snug mb-4">
            &laquo;Взял кота на выходные —<br />теперь планируем усыновление&raquo;
          </blockquote>
          <p className="text-zinc-400 text-sm">— Арендатор из Москвы</p>
        </div>
        <div className="grid grid-cols-2 gap-3 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`bg-orange-500 rounded-xl ${i % 3 === 0 ? 'h-24' : 'h-16'}`} />
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
              Добро пожаловать
            </h1>
            <p className="text-zinc-500">Войдите в свой аккаунт</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-zinc-700 text-sm font-medium">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-zinc-700 text-sm font-medium">Пароль</Label>
              <Input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="h-11"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit" disabled={loading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all gap-2 mt-1"
            >
              {loading ? 'Входим...' : (
                <>Войти <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Нет аккаунта?{' '}
            <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
