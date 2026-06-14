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
  const years = Math.floor(cat.age_months / 12)
  const ageLabel = cat.age_months >= 12
    ? `${years} ${pluralYears(years)}`
    : '< 1 года'

  return (
    <div className="bg-white/80 dark:bg-teal-950/60 backdrop-blur-sm border border-teal-100 dark:border-teal-800/30 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-teal-100/60 dark:hover:shadow-teal-900/40 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 group cursor-pointer">
      <Link href={`/cats/${cat.id}`}>
        <div className="relative aspect-[4/3] bg-teal-50 dark:bg-teal-900/30 overflow-hidden">
          {cat.photo_url ? (
            <Image
              src={cat.photo_url}
              alt={cat.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <CatIcon className="w-12 h-12 text-teal-200 dark:text-teal-700" strokeWidth={1} />
            </div>
          )}

          {!cat.is_available && (
            <div className="absolute inset-0 bg-teal-900/40 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/90 dark:bg-teal-950/90 text-teal-700 dark:text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                Недоступен
              </span>
            </div>
          )}

          {cat.description && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="bg-gradient-to-t from-teal-900/90 via-teal-900/60 to-transparent pt-10 px-3 pb-3">
                <p className="text-white text-xs leading-relaxed line-clamp-3">{cat.description}</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/cats/${cat.id}`}>
            <h3 className="font-semibold text-teal-900 dark:text-teal-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors leading-tight">
              {cat.name}
            </h3>
          </Link>
          <span className="font-bold text-teal-600 dark:text-teal-400 text-sm whitespace-nowrap">
            {cat.price_per_day} ₽/д
          </span>
        </div>
        <p className="text-xs text-teal-500 dark:text-teal-500 tracking-wide">
          <span className="font-medium">Порода:</span> {cat.breed} · {ageLabel}
        </p>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-teal-50 dark:border-teal-900/50">
            <button
              onClick={() => onToggleAvailable?.(cat.id, cat.is_available)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all active:scale-[0.97] ${
                cat.is_available
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
              }`}
            >
              {cat.is_available ? 'Скрыть' : 'Показать'}
            </button>
            <Link
              href={`/dashboard/owner/edit/${cat.id}`}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 active:scale-[0.97] transition-all text-center"
            >
              Изменить
            </Link>
            <button
              onClick={() => onDelete?.(cat.id)}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 active:scale-[0.97] transition-all"
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

