'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Filters {
  breed: string
  maxAge: number
  maxPrice: number
  search: string
}

interface Props {
  onFilter: (filters: Filters) => void
  defaultSearch?: string
}

export default function FilterBar({ onFilter, defaultSearch = '' }: Props) {
  const [breeds, setBreeds] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({ breed: '', maxAge: 240, maxPrice: 5000, search: defaultSearch })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('cats').select('breed').eq('is_available', true).then(({ data }) => {
      if (data) {
        const unique = Array.from(new Set(data.map(c => c.breed).filter((b): b is string => !!b))).sort()
        setBreeds(unique)
      }
    })
  }, [])

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onFilter(next)
  }

  return (
    <div className="bg-white dark:bg-teal-950/60 backdrop-blur-sm rounded-2xl p-4 border border-teal-100 dark:border-teal-800/40 mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 dark:text-teal-500" />
          <Input
            placeholder="Поиск по имени..."
            className="pl-9 border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-100 dark:placeholder:text-teal-500 focus:border-teal-400 focus:ring-teal-400"
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
          />
        </div>

        <Select value={filters.breed || 'all'} onValueChange={(v) => update({ breed: v === 'all' ? '' : (v ?? '') })}>
          <SelectTrigger className="border-teal-200 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-100">
            <SelectValue placeholder="Все породы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все породы</SelectItem>
            {breeds.map(b => <SelectItem key={b} value={b ?? 'unknown'}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <div>
          <p className="text-xs text-teal-400 dark:text-teal-500 mb-2.5">
            Возраст до:{' '}
            <span className="font-semibold text-teal-700 dark:text-teal-300">
              {filters.maxAge >= 240 ? 'любой' : filters.maxAge >= 12
                ? `${Math.floor(filters.maxAge / 12)} лет`
                : `${filters.maxAge} мес.`}
            </span>
          </p>
          <Slider
            min={1} max={240} step={1}
            value={[filters.maxAge]}
            onValueChange={(v) => update({ maxAge: (Array.isArray(v) ? v[0] : v) as number })}
            className="w-full"
          />
        </div>

        <div>
          <p className="text-xs text-teal-400 dark:text-teal-500 mb-2.5">
            Цена до:{' '}
            <span className="font-semibold text-teal-700 dark:text-teal-300">{filters.maxPrice} ₽/день</span>
          </p>
          <Slider
            min={100} max={5000} step={50}
            value={[filters.maxPrice]}
            onValueChange={(v) => update({ maxPrice: (Array.isArray(v) ? v[0] : v) as number })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
