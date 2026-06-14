'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, RotateCcw } from 'lucide-react'

interface Filters {
  breed: string
  maxAge: number   // в месяцах — для совместимости с родительским компонентом
  maxPrice: number
  search: string
}

interface Internal {
  breed: string
  maxAgeYears: number  // в годах — внутри компонента
  maxPrice: number
  search: string
}

interface Props {
  onFilter: (filters: Filters) => void
  defaultSearch?: string
}

const BREED_ALL = '__все__'
const MAX_YEARS = 20

function pluralYears(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'год'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'года'
  return 'лет'
}

function toExternal(f: Internal): Filters {
  return { breed: f.breed, maxAge: f.maxAgeYears * 12, maxPrice: f.maxPrice, search: f.search }
}

export default function FilterBar({ onFilter, defaultSearch = '' }: Props) {
  const [breeds, setBreeds] = useState<string[]>([])
  const [filters, setFilters] = useState<Internal>({
    breed: '',
    maxAgeYears: MAX_YEARS,
    maxPrice: 5000,
    search: defaultSearch,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('cats').select('breed').eq('is_available', true).then(({ data }) => {
      if (data) {
        const unique = Array.from(new Set(data.map(c => c.breed).filter((b): b is string => !!b))).sort()
        setBreeds(unique)
      }
    })
  }, [])

  const update = (patch: Partial<Internal>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onFilter(toExternal(next))
  }

  const reset = () => {
    const def: Internal = { breed: '', maxAgeYears: MAX_YEARS, maxPrice: 5000, search: '' }
    setFilters(def)
    onFilter(toExternal(def))
  }

  const ageLabel = filters.maxAgeYears >= MAX_YEARS ? 'Любой' : `${filters.maxAgeYears} ${pluralYears(filters.maxAgeYears)}`
  const hasActive = filters.breed !== '' || filters.maxAgeYears < MAX_YEARS || filters.maxPrice < 5000 || filters.search !== ''

  return (
    <div className="bg-white dark:bg-teal-950/60 backdrop-blur-sm rounded-2xl p-5 border border-teal-100 dark:border-teal-800/40 mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Поиск */}
        <div>
          <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1.5">Поиск по имени</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
            <input
              type="text"
              placeholder="Мурзик, Пушок..."
              value={filters.search}
              onChange={e => update({ search: e.target.value })}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-300 dark:placeholder:text-teal-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
            />
          </div>
        </div>

        {/* Порода */}
        <div>
          <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1.5">Порода</label>
          <Select
            value={filters.breed || BREED_ALL}
            onValueChange={v => update({ breed: v === BREED_ALL ? '' : (v ?? '') })}
          >
            <SelectTrigger className="h-10 border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 rounded-xl">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BREED_ALL}>Все</SelectItem>
              {breeds.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Возраст */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-teal-600 dark:text-teal-400">Возраст до</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1} max={MAX_YEARS}
                value={filters.maxAgeYears}
                onChange={e => update({ maxAgeYears: Math.min(MAX_YEARS, Math.max(1, Number(e.target.value))) })}
                className="w-16 h-7 px-2 text-xs text-center rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/60 text-teal-900 dark:text-teal-100 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300 min-w-[3.5rem]">{ageLabel}</span>
            </div>
          </div>
          <input
            type="range" min={1} max={MAX_YEARS} step={1}
            value={filters.maxAgeYears}
            onChange={e => update({ maxAgeYears: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-teal-100 dark:bg-teal-800/60
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
              accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-teal-300 dark:text-teal-600 mt-1">
            <span>1 год</span><span>20 лет</span>
          </div>
        </div>

        {/* Цена */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-teal-600 dark:text-teal-400">Цена до</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={100} max={5000} step={50}
                value={filters.maxPrice}
                onChange={e => update({ maxPrice: Math.min(5000, Math.max(100, Number(e.target.value))) })}
                className="w-16 h-7 px-2 text-xs text-center rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/60 text-teal-900 dark:text-teal-100 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300 min-w-[4rem]">{filters.maxPrice} ₽/д</span>
            </div>
          </div>
          <input
            type="range" min={100} max={5000} step={50}
            value={filters.maxPrice}
            onChange={e => update({ maxPrice: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-teal-100 dark:bg-teal-800/60
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
              accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-teal-300 dark:text-teal-600 mt-1">
            <span>100 ₽</span><span>5 000 ₽</span>
          </div>
        </div>
      </div>

      {hasActive && (
        <div className="mt-4 pt-3 border-t border-teal-100 dark:border-teal-800/40 flex justify-end">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-400 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  )
}
