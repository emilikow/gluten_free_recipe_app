import React from 'react'

const STICKERS = [
  'gluten_free','pescatarian','vegetarian','vegan','keto_friendly','dairy_free','nut_free','low_glycemic'
]

export default function StickerPicker({ value = [], onChange }) {
  function toggle(tag) {
    const set = new Set(value)
    if (set.has(tag)) set.delete(tag); else set.add(tag)
    onChange?.(Array.from(set))
  }
  return (
    <div className="flex flex-wrap gap-2">
      {STICKERS.map(t => (
        <label key={t} className={`border rounded-lg px-2 py-1 text-sm cursor-pointer ${value.includes(t)?'bg-black text-white border-black':'bg-white'}`}>
          <input type="checkbox" className="hidden" checked={value.includes(t)} onChange={()=>toggle(t)} />
          {t.replace('_',' ')}
        </label>
      ))}
    </div>
  )
}
