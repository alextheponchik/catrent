'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cat } from '@/types'
import { Upload, X } from 'lucide-react'

interface Props {
  onSuccess: () => void
  onCancel: () => void
  editCat?: Cat
}

export default function AddCatForm({ onSuccess, onCancel, editCat }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(editCat?.photo_url || '')
  const [form, setForm] = useState({
    name: editCat?.name || '',
    breed: editCat?.breed || '',
    age_months: editCat?.age_months?.toString() || '',
    feeding_requirements: editCat?.feeding_requirements || '',
    description: editCat?.description || '',
    price_per_day: editCat?.price_per_day?.toString() || '500',
  })

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      let photo_url = editCat?.photo_url || ''

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('cat-photos')
          .upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('cat-photos').getPublicUrl(path)
        photo_url = publicUrl
      }

      const payload = {
        name: form.name,
        breed: form.breed,
        age_months: parseInt(form.age_months),
        feeding_requirements: form.feeding_requirements,
        description: form.description.trim() || null,
        price_per_day: parseInt(form.price_per_day),
        photo_url,
        owner_id: user.id,
      }

      if (editCat) {
        const { error } = await supabase.from('cats').update(payload).eq('id', editCat.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cats').insert(payload)
        if (error) throw error
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const fieldCls = "w-full h-10 px-3 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-300 dark:placeholder:text-teal-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
  const labelCls = "block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelCls}>Имя кота *</label>
          <input id="name" className={fieldCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="breed" className={labelCls}>Порода *</label>
          <input id="breed" className={fieldCls} value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className={labelCls}>Возраст (мес.) *</label>
          <input id="age" type="number" min="1" max="300" className={fieldCls} value={form.age_months}
            onChange={e => setForm({ ...form, age_months: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="price" className={labelCls}>Цена за день (₽) *</label>
          <input id="price" type="number" min="50" className={fieldCls} value={form.price_per_day}
            onChange={e => setForm({ ...form, price_per_day: e.target.value })} required />
        </div>
      </div>

      <div>
        <label htmlFor="feeding" className={labelCls}>Требования по питанию *</label>
        <textarea id="feeding"
          className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-300 dark:placeholder:text-teal-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors resize-none"
          value={form.feeding_requirements}
          onChange={e => setForm({ ...form, feeding_requirements: e.target.value })}
          placeholder="Например: сухой корм 2 раза в день, не переносит рыбу..."
          required rows={2} />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>
          Описание <span className="font-normal text-teal-400 dark:text-teal-500">(необязательно)</span>
        </label>
        <textarea id="description"
          className="w-full px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/40 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-300 dark:placeholder:text-teal-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors resize-none"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Расскажите о характере, привычках, особенностях кота..."
          rows={3} />
        <p className="text-xs text-teal-400 dark:text-teal-500 mt-1">Отображается при наведении на карточку</p>
      </div>

      <div>
        <label className={labelCls}>Фото кота</label>
        <div className="mt-1">
          {photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="preview" className="h-32 w-32 object-cover rounded-xl border-2 border-teal-100 dark:border-teal-800/40" />
              <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null) }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-teal-200 dark:border-teal-700 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors group">
              <Upload className="w-5 h-5 text-teal-300 dark:text-teal-600 mb-1 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
              <span className="text-sm text-teal-400 dark:text-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">Загрузить фото</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/40">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-teal-200 dark:border-teal-700 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/40 active:scale-[0.98] transition-all">
          Отмена
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50 border-0">
          {loading ? 'Сохраняем...' : editCat ? 'Сохранить изменения' : 'Добавить кота'}
        </button>
      </div>
    </form>
  )
}
