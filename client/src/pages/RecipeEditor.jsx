import React, { useState } from 'react'
import { api } from '../api'
import StickerPicker from '../components/StickerPicker'

export default function RecipeEditor({ recipe, onBack }) {
  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [ingredients, setIngredients] = useState(recipe?.ingredients?.join('\n') || '')
  const [steps, setSteps] = useState(recipe?.steps?.map((s,i)=>`${i+1}. ${s}`).join('\n') || '')
  const [stickers, setStickers] = useState(recipe?.stickers || [])
  const [error, setError] = useState('')

  async function submit(e){
    e.preventDefault()
    setError('')
    try{
      const payload = {
        title,
        description,
        ingredients: ingredients.split('\n').map(s=>s.trim()).filter(Boolean),
        steps: steps.split('\n').map(s=>s.replace(/^\d+\.\s*/,'').trim()).filter(Boolean),
        stickers
      }
      if (recipe) await api(`/api/recipes/${recipe.id}`, { method:'PUT', body: JSON.stringify(payload)})
      else await api('/api/recipes', { method:'POST', body: JSON.stringify(payload)})
      onBack()
    }catch(e){ setError(e.message) }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-4 bg-white border rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
        <button type="button" onClick={onBack} className="underline text-sm">Back</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <div>
        <label className="font-medium">Stickers</label>
        <StickerPicker value={stickers} onChange={setStickers} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Ingredients (one per line)</label>
          <textarea className="w-full border rounded-lg px-3 py-2 h-48" value={ingredients} onChange={e=>setIngredients(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">Steps (one per line)</label>
          <textarea className="w-full border rounded-lg px-3 py-2 h-48" value={steps} onChange={e=>setSteps(e.target.value)} />
        </div>
      </div>
      <button className="rounded-lg bg-black text-white px-4 py-2">{recipe ? 'Save Changes' : 'Create Recipe'}</button>
    </form>
  )
}
