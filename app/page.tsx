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

  const heroPhotos = cats?.filter(c => c.photo_url).slice(0, 4) ?? []

  return (
    <div>
      {/* Hero — split screen */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100dvh-80px)] pb-12">
        {/* Left: copy */}
        <div className="flex flex-col gap-6 pt-8 lg:pt-0">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase w-fit">
            Платформа №1 в России
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-zinc-900">
            Возьми кота<br />
            на <span className="text-orange-500">выходные</span>
          </h1>

          <p className="text-zinc-500 text-lg leading-relaxed max-w-[48ch]">
            Находи пушистых компаньонов рядом или сдавай своего кота и помогай ему найти временную семью.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/renter">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white gap-2 transition-all">
                Найти кота <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="gap-2 active:scale-[0.98] transition-all">
                Сдать кота
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-2">
            {[
              { icon: CheckCircle, label: 'Проверенные хозяева' },
              { icon: ShieldCheck, label: 'Безопасные сделки' },
              { icon: Zap, label: 'Быстрый отклик' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Icon className="w-3.5 h-3.5 text-orange-500" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: cat photo mosaic or illustration */}
        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-3">
            {heroPhotos.length >= 4 ? (
              heroPhotos.slice(0, 4).map((cat, i) => (
                <div
                  key={cat.id}
                  className={`relative overflow-hidden rounded-2xl bg-zinc-100 ${i === 1 ? 'mt-8' : ''}`}
                  style={{ height: i === 0 ? '220px' : '160px' }}
                >
                  <Image src={cat.photo_url!} alt={cat.name} fill className="object-cover" />
                </div>
              ))
            ) : heroPhotos.length > 0 ? (
              <div className="col-span-2 relative rounded-2xl bg-zinc-100 overflow-hidden" style={{ height: '288px' }}>
                <Image src={heroPhotos[0].photo_url!} alt={heroPhotos[0].name} fill className="object-cover" />
              </div>
            ) : (
              <HeroIllustration />
            )}
          </div>
          <div className="absolute -inset-4 -z-10 bg-orange-100/60 rounded-3xl blur-2xl" />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-100 pt-12 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {[
            { icon: CheckCircle, title: 'С любовью', text: 'Все коты проверены и любят людей' },
            { icon: ShieldCheck, title: 'Безопасно', text: 'Подробная информация о питомце и хозяине' },
            { icon: Zap, title: 'Просто', text: 'Выбери, запроси и встреться с котом' },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`flex gap-4 items-start py-8 ${i === 0 ? 'pr-6' : i === 2 ? 'pl-6' : 'px-6'}`}>
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-0.5">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cat grid */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Каталог</p>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Доступные коты</h2>
          </div>
          <Link href="/dashboard/renter" className="text-zinc-500 hover:text-zinc-900 text-sm font-medium flex items-center gap-1 transition-colors">
            Смотреть все <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {cats && cats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cats.map((cat: Cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-orange-300" />
            </div>
            <p className="text-zinc-500 font-medium">Пока нет доступных котов</p>
            <Link href="/signup" className="text-orange-500 hover:text-orange-600 text-sm mt-2 inline-block transition-colors">
              Стань первым хозяином
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function HeroIllustration() {
  return (
    <div className="col-span-2 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center" style={{ height: '320px' }}>
      <svg viewBox="0 0 200 160" className="w-48 opacity-50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="120" rx="55" ry="15" fill="#f97316" opacity="0.25"/>
        <circle cx="100" cy="75" r="42" fill="#f97316" opacity="0.45"/>
        <path d="M70 52 L58 30 L82 48 Z" fill="#f97316" opacity="0.7"/>
        <path d="M130 52 L142 30 L118 48 Z" fill="#f97316" opacity="0.7"/>
        <circle cx="87" cy="70" r="5" fill="white"/>
        <circle cx="113" cy="70" r="5" fill="white"/>
        <ellipse cx="87" cy="71" rx="2.5" ry="3.5" fill="#1a1a1a"/>
        <ellipse cx="113" cy="71" rx="2.5" ry="3.5" fill="#1a1a1a"/>
        <path d="M94 82 Q100 89 106 82" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <line x1="75" y1="78" x2="60" y2="74" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="75" y1="82" x2="58" y2="82" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="125" y1="78" x2="140" y2="74" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="125" y1="82" x2="142" y2="82" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}
