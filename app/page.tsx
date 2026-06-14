import { createClient } from '@/lib/supabase/server'
import CatCard from '@/components/CatCard'
import { Cat } from '@/types'
import Link from 'next/link'
import { ArrowRight, CheckCircle, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from('cats')
    .select('*, profiles(full_name)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const heroPhotos = cats?.filter(c => c.photo_url).slice(0, 2) ?? []

  return (
    <div>
      {/* ── Hero full-bleed ── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">

        {/* Left — white, copy */}
        <div className="flex flex-col gap-8 justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-24 bg-white">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase w-fit">
            Платформа №1 в России
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-zinc-950">
            Возьми<br />кота на<br />
            <span className="text-orange-500">выходные</span>
          </h1>

          <p className="text-zinc-500 text-lg leading-relaxed max-w-[40ch]">
            Находи пушистых компаньонов рядом или сдавай своего кота и помогай ему найти временную семью.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/renter">
              <Button size="lg" className="bg-zinc-950 hover:bg-zinc-800 text-white h-12 px-8 text-base font-semibold gap-2 active:scale-[0.98] transition-all rounded-xl">
                Найти кота <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold gap-2 border-zinc-200 hover:border-zinc-300 active:scale-[0.98] transition-all rounded-xl">
                Сдать кота
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            {[
              { icon: CheckCircle, label: 'Проверенные хозяева' },
              { icon: ShieldCheck, label: 'Безопасные сделки' },
              { icon: Zap, label: 'Быстрый отклик' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                <Icon className="w-3.5 h-3.5 text-orange-500" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — orange, photos */}
        <div className="relative hidden lg:flex items-center justify-center bg-orange-500 overflow-hidden px-12">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-400 rounded-full opacity-40" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600 rounded-full opacity-40" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 bg-orange-300 rounded-full opacity-30" />

          {heroPhotos.length >= 2 ? (
            <div className="relative w-full max-w-sm z-10">
              <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl" style={{ height: '420px' }}>
                <Image src={heroPhotos[0].photo_url!} alt={heroPhotos[0].name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-bold text-lg">{heroPhotos[0].name}</p>
                  <p className="text-sm text-white/80">{heroPhotos[0].breed}</p>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-orange-500 z-20">
                <Image src={heroPhotos[1].photo_url!} alt={heroPhotos[1].name} fill className="object-cover" />
              </div>
            </div>
          ) : heroPhotos.length === 1 ? (
            <div className="relative w-full max-w-sm z-10 rounded-3xl overflow-hidden shadow-2xl" style={{ height: '420px' }}>
              <Image src={heroPhotos[0].photo_url!} alt={heroPhotos[0].name} fill className="object-cover" />
            </div>
          ) : (
            <HeroIllustration />
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 border-b border-zinc-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {[
            { icon: CheckCircle, title: 'С любовью', text: 'Все коты проверены и любят людей' },
            { icon: ShieldCheck, title: 'Безопасно', text: 'Подробная информация о питомце и хозяине' },
            { icon: Zap, title: 'Просто', text: 'Выбери, запроси и встреться с котом' },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`flex gap-4 items-start py-8 ${i === 0 ? 'pr-6' : i === 2 ? 'pl-6' : 'px-6'}`}>
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-0.5">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">Каталог</p>
            <h2 className="text-4xl font-bold text-zinc-950 tracking-tight">Доступные коты</h2>
          </div>
          <Link href="/dashboard/renter" className="text-zinc-400 hover:text-zinc-900 text-sm font-medium flex items-center gap-1.5 transition-colors group">
            Смотреть все
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
          <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-zinc-500 font-semibold text-lg mb-1">Пока нет доступных котов</p>
            <p className="text-zinc-400 text-sm mb-5">Станьте первым хозяином на платформе</p>
            <Link href="/signup">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.98] transition-all">
                Добавить кота
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function HeroIllustration() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 180" className="w-56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="95" r="55" fill="white" opacity="0.15" />
        <circle cx="100" cy="90" r="42" fill="white" opacity="0.2" />
        <path d="M68 60 L55 34 L80 54 Z" fill="white" opacity="0.8" />
        <path d="M132 60 L145 34 L120 54 Z" fill="white" opacity="0.8" />
        <circle cx="100" cy="90" r="38" fill="white" opacity="0.15" />
        <circle cx="86" cy="84" r="6" fill="white" />
        <circle cx="114" cy="84" r="6" fill="white" />
        <ellipse cx="86" cy="85" rx="3" ry="4" fill="#1a1a1a" opacity="0.6" />
        <ellipse cx="114" cy="85" rx="3" ry="4" fill="#1a1a1a" opacity="0.6" />
        <path d="M92 99 Q100 107 108 99" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        <line x1="72" y1="92" x2="55" y2="87" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="72" y1="97" x2="53" y2="97" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="128" y1="92" x2="145" y2="87" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="128" y1="97" x2="147" y2="97" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </svg>
      <p className="text-white/70 text-sm text-center font-medium">Зарегистрируйтесь,<br />чтобы увидеть котов</p>
    </div>
  )
}
