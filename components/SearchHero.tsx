'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const POPULAR_BREEDS = ['Мейн-кун', 'Британец', 'Персидский', 'Сфинкс', 'Шотландский вислоухий']

export default function SearchHero() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/dashboard/renter?q=${encodeURIComponent(q)}` : '/dashboard/renter')
  }

  const searchBreed = (breed: string) => {
    router.push(`/dashboard/renter?q=${encodeURIComponent(breed)}`)
  }

  return (
    <>
      <form
        onSubmit={handleSearch}
        className="w-full max-w-2xl bg-white/95 dark:bg-teal-950/90 backdrop-blur-xl rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl shadow-teal-900/40 border border-white/40"
      >
        <div className="flex-1 flex items-center gap-3 px-4 py-2">
          <Search className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Порода, имя или район..."
            className="flex-1 bg-transparent text-teal-900 dark:text-teal-100 placeholder:text-teal-300 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white h-11 px-7 rounded-xl font-semibold text-sm shadow-sm active:scale-[0.97] transition-all cursor-pointer"
        >
          Найти кота
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        <span className="text-teal-200/70 text-xs font-medium">Популярные:</span>
        {POPULAR_BREEDS.map(breed => (
          <button
            key={breed}
            type="button"
            onClick={() => searchBreed(breed)}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/20 transition-all cursor-pointer active:scale-[0.97]"
          >
            {breed}
          </button>
        ))}
      </div>
    </>
  )
}
