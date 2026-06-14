'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Имя кота *</Label>
          <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="breed">Порода *</Label>
          <Input id="breed" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age">Возраст (месяцев) *</Label>
          <Input id="age" type="number" min="1" max="300" value={form.age_months}
            onChange={e => setForm({ ...form, age_months: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="price">Цена за день (₽) *</Label>
          <Input id="price" type="number" min="50" value={form.price_per_day}
            onChange={e => setForm({ ...form, price_per_day: e.target.value })} required />
        </div>
      </div>

      <div>
        <Label htmlFor="feeding">Требования по питанию *</Label>
        <Textarea id="feeding" value={form.feeding_requirements}
          onChange={e => setForm({ ...form, feeding_requirements: e.target.value })}
          placeholder="Например: сухой корм 2 раза в день, не переносит рыбу..."
          required rows={2} />
      </div>

      <div>
        <Label htmlFor="description">
          Описание <span className="text-zinc-400 font-normal">(необязательно)</span>
        </Label>
        <Textarea id="description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Расскажите о характере, привычках, особенностях кота..."
          rows={3} />
        <p className="text-xs text-zinc-400 mt-1">Отображается при наведении на карточку кота</p>
      </div>

      <div>
        <Label>Фото кота</Label>
        <div className="mt-1">
          {photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="preview" className="h-32 w-32 object-cover rounded-xl" />
              <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null) }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
              <Upload className="w-6 h-6 text-zinc-400 mb-1" />
              <span className="text-sm text-zinc-500">Загрузить фото</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Отмена</Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
          {loading ? 'Сохраняем...' : editCat ? 'Сохранить' : 'Добавить кота'}
        </Button>
      </div>
    </form>
  )
}
