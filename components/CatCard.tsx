import Link from 'next/link'
import Image from 'next/image'
import { Cat } from '@/types'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

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
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
      <Link href={`/cats/${cat.id}`}>
        <div className="relative h-52 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
          {cat.photo_url ? (
            <Image
              src={cat.photo_url}
              alt={cat.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-6xl">🐱</div>
          )}
          {!cat.is_available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Недоступен</Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <Link href={`/cats/${cat.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                {cat.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">{cat.breed} · {ageLabel}</p>
          </div>
          <span className="font-bold text-orange-500 text-sm whitespace-nowrap ml-2">
            {cat.price_per_day} ₽/день
          </span>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            <button
              onClick={() => onToggleAvailable?.(cat.id, cat.is_available)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                cat.is_available
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {cat.is_available ? 'Скрыть' : 'Показать'}
            </button>
            <Link
              href={`/dashboard/owner/edit/${cat.id}`}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-center"
            >
              Изменить
            </Link>
            <button
              onClick={() => onDelete?.(cat.id)}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
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
