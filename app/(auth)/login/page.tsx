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
    <div className="min-h-[calc(100dvh-64px)] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-br from-violet-700 via-violet-600 to-purple-500 flex items-center justify-center px-4 py-12">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-400/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
            <Cat className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-2xl font-extrabold text-white">CatRent</span>
        </Link>

        {/* Glass card */}
        <div className="bg-white/95 dark:bg-violet-950/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-violet-900/30 border border-white/30 dark:border-violet-700/30">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-violet-900 dark:text-white tracking-tight mb-1">
              Рады видеть вас снова
            </h1>
            <p className="text-violet-400 dark:text-violet-400 text-sm">Войдите, чтобы найти нового пушистого друга</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-violet-700 dark:text-violet-300 text-sm font-medium">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="h-11 rounded-xl border-violet-200 dark:border-violet-700 dark:bg-violet-900/40 focus:border-violet-400 focus:ring-violet-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-violet-700 dark:text-violet-300 text-sm font-medium">Пароль</Label>
              <Input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="h-11 rounded-xl border-violet-200 dark:border-violet-700 dark:bg-violet-900/40 focus:border-violet-400 focus:ring-violet-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/50 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit" disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] transition-all gap-2 rounded-xl text-base font-semibold mt-1 border-0 shadow-sm shadow-violet-300 dark:shadow-violet-900/50"
            >
              {loading ? 'Входим...' : (<>Войти <ArrowRight className="w-4 h-4" /></>)}
            </Button>
          </form>
        </div>

        <p className="text-center text-violet-200/80 text-sm mt-6">
          Нет аккаунта?{' '}
          <Link href="/signup" className="text-white font-semibold hover:text-violet-100 transition-colors">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
