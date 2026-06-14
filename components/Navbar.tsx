'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Cat, LogOut, LayoutDashboard, Sun, Moon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }
    getProfile()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { getProfile() })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-violet-950/80 backdrop-blur-xl border-b border-violet-100/60 dark:border-violet-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-violet-900 dark:text-violet-100 hover:text-violet-700 dark:hover:text-white transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200 dark:shadow-violet-900/50">
              <Cat className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span>CatRent</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-violet-400 hover:text-violet-700 dark:hover:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/40 transition-all"
                aria-label="Сменить тему"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {loading ? null : profile ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-violet-900/40 font-medium">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">{profile.full_name}</span>
                    <span className="text-xs text-violet-300 dark:text-violet-600 hidden sm:inline">
                      · {profile.role === 'owner' ? 'Хозяин' : 'Арендатор'}
                    </span>
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm"
                  onClick={handleSignOut}
                  className="text-violet-300 dark:text-violet-600 hover:text-violet-700 dark:hover:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/40"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-violet-900/40 font-medium">
                    Войти
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/50 active:scale-[0.97] transition-all font-medium border-0">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Регистрация
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
