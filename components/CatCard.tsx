import Link from 'next/link'
import Image from 'next/image'
import { Cat } from '@/types'
import { Cat as CatIcon } from 'lucide-react'

interface Props {
  cat: Cat
  showActions?: boolean
  onToggleAvailable?: (id: string, current: boolean) => void
  onDelete?: (id: string) => void
}

export default function CatCard({ cat, showActions, onToggleAvailable, onDelete }: Props) {
  const ageLabel = cat.age_months >= 12
    ? `${Math.floor(cat.age_months / 12)} ${pluralYears(Math.floor(cat.age_months / 12))}`
    : `${cat.age_months} ${pluralMonths(cat.age_months)}`

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200 hover:shadow-md active:scale-[0.99] transition-all duration-200 group">
      <Link href={`/cats/${cat.id}`}>
        <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
          {cat.photo_url ? (
            <Image
              src={cat.photo_url}
              alt={cat.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <CatIcon className="w-12 h-12 text-zinc-300" strokeWidth={1} />
            </div>
          )}
          {!cat.is_available && (
            <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
              <span className="bg-white text-zinc-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                Недоступен
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/cats/${cat.id}`}>
            <h3 className="font-semibold text-zinc-900 hover:text-orange-500 transition-colors leading-tight">
              {cat.name}
            </h3>
          </Link>
          <span className="font-bold text-orange-500 text-sm whitespace-nowrap">
            {cat.price_per_day} ₽/д
          </span>
        </div>
        <p className="text-xs text-zinc-400 tracking-wide">{cat.breed} · {ageLabel}</p>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-50">
            <button
              onClick={() => onToggleAvailable?.(cat.id, cat.is_available)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors active:scale-[0.97] ${
                cat.is_available
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {cat.is_available ? 'Скрыть' : 'Показать'}
            </button>
            <Link
              href={`/dashboard/owner/edit/${cat.id}`}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-zinc-50 text-zinc-600 hover:bg-zinc-100 active:scale-[0.97] transition-all text-center"
            >
              Изменить
            </Link>
            <button
              onClick={() => onDelete?.(cat.id)}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.97] transition-all"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function pluralYears(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'год'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'года'
  return 'лет'
}

function pluralMonths(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'месяц'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'месяца'
  return 'месяцев'
}
