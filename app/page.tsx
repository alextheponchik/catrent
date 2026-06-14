import { createClient } from '@/lib/supabase/server'
import CatCard from '@/components/CatCard'
import { Cat } from '@/types'
import Link from 'next/link'
import { ArrowRight, Heart, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from('cats')
    .select('*, profiles(full_name)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span>🐱</span> Платформа аренды котов №1 в России
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Возьми кота на<br />
          <span className="text-orange-500">выходные</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Найди пушистого компаньона рядом с домом или сдай своего кота и помоги ему найти временную семью
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/renter">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              Найти кота <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="gap-2">
              Сдать кота
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Heart, title: 'С любовью', text: 'Все коты проверены и любят людей' },
          { icon: Shield, title: 'Безопасно', text: 'Подробная информация о питомце и хозяине' },
          { icon: Star, title: 'Просто', text: 'Выбери, запроси и встреться с котом' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{text}</p>
          </div>
        ))}
      </section>

      {/* Cats grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Доступные коты</h2>
          <Link href="/dashboard/renter" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
            Все коты <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {cats && cats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cats.map((cat: Cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🐱</div>
            <p className="text-gray-500">Пока нет доступных котов.</p>
            <Link href="/signup" className="text-orange-500 hover:underline text-sm mt-2 inline-block">
              Стань первым хозяином!
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
