import React, { useRef, useState } from 'react'
import { API_BASE } from '../api'

export default function ImageUploader({ value = [], onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function uploadFiles(files) {
    setBusy(true); setError('')
    try {
      const urls = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('image', file)
        const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd })
        if (!res.ok) throw new Error('upload failed')
        const { url } = await res.json()
        urls.push(url)
      }
      onChange?.([...(value || []), ...urls])
    } catch (e) {
      setError('Upload failed. Try smaller images.')
    } finally {
      setBusy(false)
    }
  }

  function onPick(e) {
    const files = e.target.files
    if (files && files.length) uploadFiles(files)
    e.target.value = ''
  }

  function remove(idx) {
    const next = [...value]; next.splice(idx, 1); onChange?.(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button type="button" onClick={()=>inputRef.current?.click()} className="rounded-lg border px-3 py-2">{busy ? 'Uploading…' : 'Upload Images'}</button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      {value?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((u, idx)=>(
            <div key={idx} className="relative">
              <img src={u} className="w-24 h-24 object-cover rounded-lg border" />
              <button type="button" onClick={()=>remove(idx)} className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
