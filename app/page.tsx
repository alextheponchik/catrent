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
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 relative overflow-hidden min-h-[580px] flex flex-col">
        {/* Base */}
        <div className="absolute inset-0 bg-teal-950" />

        {/* Organic animated blobs — make it non-rectangular */}
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-teal-700/60 rounded-full blur-[140px] animate-float delay-0" />
        <div className="absolute -top-16 right-0 w-[500px] h-[600px] bg-cyan-600/35 rounded-full blur-[120px] translate-x-1/4 animate-float-slow delay-2s" />
        <div className="absolute top-1/3 left-1/4 w-[380px] h-[380px] bg-teal-500/25 rounded-full blur-[90px] animate-float delay-4s" />
        <div className="absolute bottom-0 right-1/4 w-[320px] h-[320px] bg-cyan-700/30 rounded-full blur-[100px] animate-float-slow delay-3s" />
        <div className="absolute -bottom-20 left-0 w-[500px] h-[300px] bg-emerald-700/20 rounded-full blur-[120px] animate-float delay-2s" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-28 lg:py-40 flex-1">
          <div className="animate-fade-in inline-flex items-center gap-2 bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase backdrop-blur-sm mb-8 border border-white/25">
            <Star className="w-3 h-3 fill-white" />
            Платформа №1 по аренде котов
          </div>

          <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 max-w-3xl">
            Найди кота<br />
            <span className="text-teal-300">рядом с тобой</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-teal-100/90 text-lg leading-relaxed max-w-xl mb-10">
            Арендуй пушистого друга на день, неделю или месяц. Или сдай своего кота и помоги ему найти временную семью.
          </p>

          <div className="animate-scale-in delay-300 w-full max-w-2xl">
            <SearchHero />
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up delay-500 flex flex-wrap items-center justify-center gap-10 mt-14">
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

        {/* Organic wave bottom — connects to page background */}
        <div className="relative z-10 w-full flex-shrink-0 -mb-px">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block" style={{ height: '80px' }}>
            <path
              d="M0,40 C180,80 360,10 540,45 C720,80 900,5 1080,38 C1260,70 1380,30 1440,40 L1440,80 L0,80 Z"
              className="fill-[hsl(var(--background))]"
            />
          </svg>
        </div>
      </section>

      {/* ── Features — no rectangular cards, just centered layout ── */}
      <section className="py-20">
        <div className="text-center mb-16">
          <p className="animate-fade-in text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">Почему CatRent</p>
          <h2 className="animate-fade-in-up delay-100 text-3xl font-bold text-teal-900 dark:text-white tracking-tight">Надёжно и удобно</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              icon: Heart,
              title: 'С любовью',
              text: 'Все коты проверены и обожают людей. Мы заботимся о каждом питомце.',
              grad: 'from-pink-500 to-rose-400',
              glow: 'shadow-pink-200 dark:shadow-pink-900/40',
              delay: '',
            },
            {
              icon: Shield,
              title: 'Безопасно',
              text: 'Полная информация о питомце и хозяине. Верифицированные профили.',
              grad: 'from-teal-600 to-cyan-500',
              glow: 'shadow-teal-200 dark:shadow-teal-900/40',
              delay: 'delay-200',
            },
            {
              icon: Zap,
              title: 'Быстро',
              text: 'Заявка одобряется за несколько часов. Мгновенный чат с хозяином.',
              grad: 'from-amber-500 to-orange-400',
              glow: 'shadow-amber-200 dark:shadow-amber-900/40',
              delay: 'delay-400',
            },
          ].map(({ icon: Icon, title, text, grad, glow, delay }) => (
            <div key={title} className={`text-center group animate-fade-in-up ${delay}`}>
              <div className={`w-16 h-16 bg-gradient-to-br ${grad} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${glow} group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                <Icon className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-teal-900 dark:text-white text-lg mb-2">{title}</h3>
              <p className="text-sm text-teal-500 dark:text-teal-400 leading-relaxed max-w-xs mx-auto">{text}</p>
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
          <Link
            href="/dashboard/renter"
            className="text-teal-400 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-200 text-sm font-medium flex items-center gap-1.5 transition-colors group"
          >
            Все коты
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {cats && cats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cats.map((cat: Cat) => <CatCard key={cat.id} cat={cat} />)}
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

      {/* ── CTA — rounded card, not a hard rectangle ── */}
      <section className="mt-12 mb-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 rounded-3xl px-8 sm:px-12 lg:px-16 py-16 text-center shadow-2xl shadow-teal-900/20">
          {/* Inner blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-600/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-cyan-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-teal-500/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Есть кот? Сдайте в аренду</h2>
            <p className="text-teal-100/90 mb-8 max-w-md mx-auto leading-relaxed">
              Помогите питомцу найти временную семью и получите дополнительный доход
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 active:scale-[0.97] font-bold h-12 px-8 transition-all rounded-xl shadow-lg shadow-teal-900/20 border-0"
              >
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
