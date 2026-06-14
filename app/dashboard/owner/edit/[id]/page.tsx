'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cat } from '@/types'
import AddCatForm from '@/components/AddCatForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const [cat, setCat] = useState<Cat | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('cats').select('*').eq('id', id).single().then(({ data }) => setCat(data))
  }, [id])

  if (!cat) return <div className="text-center py-16 text-gray-400">Загружаем...</div>

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/dashboard/owner" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Назад к моим котам
      </Link>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Редактировать: {cat.name}</h1>
        <AddCatForm
          editCat={cat}
          onSuccess={() => router.push('/dashboard/owner')}
          onCancel={() => router.push('/dashboard/owner')}
        />
      </div>
    </div>
  )
}
