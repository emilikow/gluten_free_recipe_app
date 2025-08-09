import React, { useEffect, useState } from 'react'
import { api } from '../api'
import RecipeCard from '../components/RecipeCard'
import SearchBar from '../components/SearchBar'

export default function Dashboard({ onEdit }) {
  const [recipes, setRecipes] = useState([])
  const [error, setError] = useState('')

  async function load(params={}){
    try{
      const qs = new URLSearchParams(params).toString()
      const data = await api(`/api/recipes?${qs}`)
      setRecipes(data)
    }catch(e){ setError(e.message) }
  }

  useEffect(()=>{ load() }, [])

  async function remove(r){
    if (!confirm('Delete this recipe?')) return
    await api(`/api/recipes/${r.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-4">
      <SearchBar onSearch={load} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {recipes.map(r => (
          <RecipeCard key={r.id} recipe={r} onEdit={onEdit} onDelete={remove} />
        ))}
      </div>
    </div>
  )
}
