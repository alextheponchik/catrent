import { createClient } from '@/lib/supabase/server'
import CatCard from '@/components/CatCard'
import SearchHero from '@/components/SearchHero'
import { Cat } from '@/types'
import Link from 'next/link'
import { ArrowRight, Shield, Heart, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

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
        {/* Organic background: dark base + overlapping blobs */}
        <div className="absolute inset-0 bg-teal-950" />
        <div className="absolute -top-24 -left-24 w-[560px] h-[560px] bg-teal-600/50 rounded-full blur-[130px]" />
        <div className="absolute top-0 right-0 w-[450px] h-[650px] bg-cyan-500/30 rounded-full blur-[110px] translate-x-1/4 -translate-y-1/4" />
        <div className="absolute top-1/3 left-1/3 w-[320px] h-[320px] bg-teal-400/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-8 right-1/3 w-[280px] h-[280px] bg-cyan-600/25 rounded-full blur-[90px]" />
        <div className="absolute -bottom-16 left-0 w-[400px] h-[280px] bg-emerald-600/20 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-28 lg:py-40">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase backdrop-blur-sm mb-8 border border-white/25">
            <Star className="w-3 h-3 fill-white" />
            Платформа №1 по аренде котов
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 max-w-3xl">
            Найди кота<br />
            <span className="text-teal-300">рядом с тобой</span>
          </h1>

          <p className="text-teal-100/90 text-lg leading-relaxed max-w-xl mb-10">
            Арендуй пушистого друга на день, неделю или месяц. Или сдай своего кота и помоги ему найти временную семью.
          </p>

          <SearchHero />

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-10 mt-14">
            {[
              { value: `${cats?.length ?? 0}+`, label: 'котов онлайн' },
              { value: '4.9★', label: 'средний рейтинг' },
              { value: '100%', label: 'безопасных сделок' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white leading-none">{value}</p>
                <p className="text-teal-200/80 text-xs mt-1.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Organic wave bottom */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,20 C240,55 480,0 720,30 C960,58 1200,5 1440,25 L1440,60 L0,60 Z"
            style={{ fill: 'hsl(var(--background))' }}
          />
        </svg>
      </section>

      {/* ── Features ── */}
      <section className="py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">Почему CatRent</p>
          <h2 className="text-3xl font-bold text-teal-900 dark:text-white tracking-tight">Надёжно и удобно</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Heart, title: 'С любовью', text: 'Все коты проверены и обожают людей', grad: 'from-pink-500 to-rose-400' },
            { icon: Shield, title: 'Безопасно', text: 'Полная информация о питомце и хозяине', grad: 'from-teal-600 to-cyan-500' },
            { icon: Zap, title: 'Быстро', text: 'Заявка одобряется за несколько часов', grad: 'from-amber-500 to-orange-400' },
          ].map(({ icon: Icon, title, text, grad }) => (
            <div key={title} className="bg-white/80 dark:bg-teal-950/60 backdrop-blur-sm border border-teal-100 dark:border-teal-800/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-teal-100/50 dark:hover:shadow-teal-900/30 hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-teal-900 dark:text-white mb-1.5">{title}</h3>
              <p className="text-sm text-teal-500 dark:text-teal-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1.5">Каталог</p>
            <h2 className="text-3xl font-bold text-teal-900 dark:text-white tracking-tight">Доступные коты</h2>
          </div>
          <Link href="/dashboard/renter" className="text-teal-400 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-200 text-sm font-medium flex items-center gap-1.5 transition-colors group">
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
          <div className="text-center py-24 bg-white/60 dark:bg-teal-950/40 backdrop-blur-sm rounded-3xl border border-teal-100 dark:border-teal-800/30">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-50 dark:from-teal-900/40 dark:to-cyan-950/40 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-teal-200/50 dark:border-teal-800/30">
              <Heart className="w-8 h-8 text-teal-300 dark:text-teal-500" />
            </div>
            <p className="text-teal-600 dark:text-teal-400 font-semibold text-lg mb-1">Пока нет доступных котов</p>
            <p className="text-teal-400 dark:text-teal-500 text-sm mb-6">Станьте первым хозяином на платформе</p>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white active:scale-[0.98] transition-all font-semibold border-0">
                Добавить кота
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 mt-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 px-8 sm:px-12 lg:px-16 py-16 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-600/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-cyan-500/30 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Есть кот? Сдайте в аренду</h2>
            <p className="text-teal-100/90 mb-8 max-w-md mx-auto leading-relaxed">
              Помогите питомцу найти временную семью и получите дополнительный доход
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 active:scale-[0.97] font-bold h-12 px-8 transition-all rounded-xl shadow-lg shadow-teal-900/20 border-0">
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
