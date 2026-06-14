'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cat } from '@/types'
import AddCatForm from '@/components/AddCatForm'
import { ArrowLeft, Cat as CatIcon } from 'lucide-react'
import Link from 'next/link'

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const [cat, setCat] = useState<Cat | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('cats').select('*').eq('id', id).single().then(({ data }) => setCat(data))
  }, [id])

  if (!cat) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="h-8 w-40 bg-teal-100 dark:bg-teal-900/40 rounded-lg animate-pulse mb-8" />
        <div className="bg-white dark:bg-teal-950/60 rounded-3xl border border-teal-100 dark:border-teal-800/40 p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-teal-50 dark:bg-teal-900/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in-up">
      {/* Back link */}
      <Link
        href="/dashboard/owner"
        className="inline-flex items-center gap-2 text-teal-500 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-200 mb-6 text-sm font-medium transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Назад к моим котам
      </Link>

      {/* Card */}
      <div className="relative overflow-hidden bg-white dark:bg-teal-950/60 backdrop-blur-sm rounded-3xl border border-teal-100 dark:border-teal-800/40 shadow-xl shadow-teal-100/40 dark:shadow-teal-900/20">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-cyan-400/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-sm shadow-teal-200 dark:shadow-teal-900/40 flex-shrink-0">
              <CatIcon className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-500 uppercase tracking-widest leading-none mb-0.5">Редактирование</p>
              <h1 className="text-xl font-bold text-teal-900 dark:text-white leading-none">{cat.name}</h1>
            </div>
          </div>

          <AddCatForm
            editCat={cat}
            onSuccess={() => router.push('/dashboard/owner')}
            onCancel={() => router.push('/dashboard/owner')}
          />
        </div>
      </div>
    </div>
  )
}
