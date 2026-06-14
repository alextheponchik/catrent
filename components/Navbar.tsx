'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Cat, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getProfile()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900">
            <span className="text-orange-500">
              <Cat className="w-5 h-5" />
            </span>
            <span>CatRent</span>
          </Link>

          <div className="flex items-center gap-2">
            {loading ? null : profile ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">{profile.full_name}</span>
                    <span className="text-xs text-zinc-400 hidden sm:inline">
                      · {profile.role === 'owner' ? 'Хозяин' : 'Арендатор'}
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-zinc-400 hover:text-zinc-900">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-zinc-600">Войти</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white transition-all">
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
