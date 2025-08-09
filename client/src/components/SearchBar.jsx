import React, { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('')
  const [stickers, setStickers] = useState('')
  const [include, setInclude] = useState('')
  const [exclude, setExclude] = useState('')

  function submit(e){
    e.preventDefault()
    onSearch?.({ q, stickers, include, exclude })
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-2xl p-4 grid md:grid-cols-4 gap-3">
      <input className="border rounded-lg px-3 py-2 col-span-2" placeholder="Search recipes…" value={q} onChange={e=>setQ(e.target.value)} />
      <input className="border rounded-lg px-3 py-2" placeholder="Stickers (comma‑sep)" value={stickers} onChange={e=>setStickers(e.target.value)} />
      <div className="md:col-span-4 grid md:grid-cols-3 gap-3">
        <input className="border rounded-lg px-3 py-2" placeholder="Include ingredients (comma‑sep)" value={include} onChange={e=>setInclude(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" placeholder="Exclude ingredients (comma‑sep)" value={exclude} onChange={e=>setExclude(e.target.value)} />
        <button className="rounded-lg bg-black text-white py-2">Search</button>
      </div>
    </form>
  )
}
