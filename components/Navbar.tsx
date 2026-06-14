'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Cat, LogOut, LayoutDashboard, Sun, Moon, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const userIdRef = useRef<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const fetchUnread = useCallback(async (uid: string) => {
    const [{ data: reads }, { data: msgs }] = await Promise.all([
      supabase.from('conversation_reads')
        .select('rental_request_id, last_read_at')
        .eq('user_id', uid),
      supabase.from('messages')
        .select('rental_request_id, created_at')
        .neq('sender_id', uid)
        .order('created_at', { ascending: false }),
    ])
    const readMap = new Map(reads?.map(r => [r.rental_request_id, r.last_read_at]) ?? [])
    const seen = new Set<string>()
    let count = 0
    for (const msg of msgs ?? []) {
      if (!seen.has(msg.rental_request_id)) {
        seen.add(msg.rental_request_id)
        const lastRead = readMap.get(msg.rental_request_id)
        if (!lastRead || msg.created_at > lastRead) count++
      }
    }
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userIdRef.current = user.id
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
        fetchUnread(user.id)
      } else {
        userIdRef.current = null
        setProfile(null)
        setUnreadCount(0)
      }
      setLoading(false)
    }

    getProfile()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { getProfile() })

    const channel = supabase
      .channel('navbar-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        if (userIdRef.current) fetchUnread(userIdRef.current)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetchUnread])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-teal-950/80 backdrop-blur-xl border-b border-teal-100/60 dark:border-teal-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-teal-900 dark:text-teal-100 hover:text-teal-700 dark:hover:text-white transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm shadow-teal-200 dark:shadow-teal-900/50">
              <Cat className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span>CatRent</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-teal-400 hover:text-teal-700 dark:hover:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-all"
                aria-label="Сменить тему"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {loading ? null : profile ? (
              <>
                <Link href="/chat" className="relative w-9 h-9 flex items-center justify-center rounded-xl text-teal-400 hover:text-teal-700 dark:hover:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-all" aria-label="Чат">
                  <MessageCircle className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-teal-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-teal-600 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white hover:bg-teal-50 dark:hover:bg-teal-900/40 font-medium">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">{profile.full_name}</span>
                    <span className="text-xs text-teal-300 dark:text-teal-600 hidden sm:inline">
                      · {profile.role === 'owner' ? 'Хозяин' : 'Арендатор'}
                    </span>
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm"
                  onClick={handleSignOut}
                  className="text-teal-300 dark:text-teal-600 hover:text-teal-700 dark:hover:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white hover:bg-teal-50 dark:hover:bg-teal-900/40 font-medium">
                    Войти
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white shadow-sm shadow-teal-200 dark:shadow-teal-900/50 active:scale-[0.97] transition-all font-medium border-0">
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
