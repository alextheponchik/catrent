import { createClient } from '@/lib/supabase/server'
import CatCard from '@/components/CatCard'
import { Cat } from '@/types'
import Link from 'next/link'
import { ArrowRight, Search, Shield, Heart, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const POPULAR_BREEDS = ['Мейн-кун', 'Британец', 'Персидский', 'Сфинкс', 'Шотландский вислоухий']

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
      {/* ── Hero ── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-violet-600 to-purple-500" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-400/40 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-400/25 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-28 lg:py-40">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase backdrop-blur-sm mb-8 border border-white/25">
            <Star className="w-3 h-3 fill-white" />
            Платформа №1 по аренде котов
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 max-w-3xl">
            Найди кота<br />
            <span className="text-violet-200">рядом с тобой</span>
          </h1>

          <p className="text-violet-100/90 text-lg leading-relaxed max-w-xl mb-10">
            Арендуй пушистого друга на день, неделю или месяц. Или сдай своего кота и помоги ему найти временную семью.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-2xl bg-white/95 dark:bg-violet-950/90 backdrop-blur-xl rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl shadow-violet-900/30 border border-white/40">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Search className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Порода, имя или район..."
                className="flex-1 bg-transparent text-violet-900 dark:text-violet-100 placeholder:text-violet-300 text-sm outline-none"
              />
            </div>
            <Link href="/dashboard/renter">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white h-11 px-7 rounded-xl font-semibold text-sm shadow-sm active:scale-[0.97] transition-all border-0">
                Найти кота
              </Button>
            </Link>
          </div>

          {/* Popular breeds */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-violet-200/70 text-xs font-medium">Популярные:</span>
            {POPULAR_BREEDS.map(breed => (
              <Link
                key={breed}
                href="/dashboard/renter"
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/20 transition-all cursor-pointer active:scale-[0.97]"
              >
                {breed}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-10 mt-16">
            {[
              { value: `${cats?.length ?? 0}+`, label: 'котов онлайн' },
              { value: '4.9★', label: 'средний рейтинг' },
              { value: '100%', label: 'безопасных сделок' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white leading-none">{value}</p>
                <p className="text-violet-200/80 text-xs mt-1.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* ── Features ── */}
      <section className="py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">Почему CatRent</p>
          <h2 className="text-3xl font-bold text-violet-900 dark:text-white tracking-tight">Надёжно и удобно</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Heart, title: 'С любовью', text: 'Все коты проверены и обожают людей', grad: 'from-pink-500 to-rose-400' },
            { icon: Shield, title: 'Безопасно', text: 'Полная информация о питомце и хозяине', grad: 'from-violet-600 to-purple-500' },
            { icon: Zap, title: 'Быстро', text: 'Заявка одобряется за несколько часов', grad: 'from-amber-500 to-orange-400' },
          ].map(({ icon: Icon, title, text, grad }) => (
            <div key={title} className="bg-white/80 dark:bg-violet-950/60 backdrop-blur-sm border border-violet-100 dark:border-violet-800/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/30 hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-violet-900 dark:text-white mb-1.5">{title}</h3>
              <p className="text-sm text-violet-500 dark:text-violet-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1.5">Каталог</p>
            <h2 className="text-3xl font-bold text-violet-900 dark:text-white tracking-tight">Доступные коты</h2>
          </div>
          <Link href="/dashboard/renter" className="text-violet-400 dark:text-violet-500 hover:text-violet-700 dark:hover:text-violet-200 text-sm font-medium flex items-center gap-1.5 transition-colors group">
            Все коты
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {cats && cats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cats.map((cat: Cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/60 dark:bg-violet-950/40 backdrop-blur-sm rounded-3xl border border-violet-100 dark:border-violet-800/30">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-900/40 dark:to-purple-950/40 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-violet-200/50 dark:border-violet-800/30">
              <Heart className="w-8 h-8 text-violet-300 dark:text-violet-500" />
            </div>
            <p className="text-violet-600 dark:text-violet-400 font-semibold text-lg mb-1">Пока нет доступных котов</p>
            <p className="text-violet-400 dark:text-violet-500 text-sm mb-6">Станьте первым хозяином на платформе</p>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white active:scale-[0.98] transition-all font-semibold border-0">
                Добавить кота
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 mt-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 to-purple-600 px-8 sm:px-12 lg:px-16 py-16 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-500/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-purple-400/30 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Есть кот? Сдайте в аренду</h2>
            <p className="text-violet-100/90 mb-8 max-w-md mx-auto leading-relaxed">
              Помогите питомцу найти временную семью и получите дополнительный доход
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 active:scale-[0.97] font-bold h-12 px-8 transition-all rounded-xl shadow-lg shadow-violet-800/20 border-0">
                Добавить кота бесплатно
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
