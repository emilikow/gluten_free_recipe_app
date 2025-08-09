import React from 'react'

const LABELS = {
  gluten_free: ['GF','badge-green'],
  pescatarian: ['Pesc','badge-blue'],
  vegetarian: ['Veg','badge-yellow'],
  vegan: ['Vegan','badge-purple'],
  keto_friendly: ['Keto','badge-gray'],
  dairy_free: ['Dairy‑Free','badge-pink'],
  nut_free: ['Nut‑Free','badge-gray'],
  low_glycemic: ['Low‑GI','badge-green'],
}

export default function RecipeCard({ recipe, onEdit, onDelete }) {
  const mainImage = recipe.images?.[0]
  return (
    <div className="bg-white border rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{recipe.title}</h3>
          <p className="text-sm text-gray-600">shared</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>onEdit?.(recipe)} className="text-sm underline">Edit</button>
          <button onClick={()=>onDelete?.(recipe)} className="text-sm text-red-600 underline">Delete</button>
        </div>
      </div>
      {mainImage && <img src={mainImage} alt="" className="w-full h-48 object-cover rounded-xl border" />}
      <p className="text-gray-800">{recipe.description}</p>
      <div className="flex flex-wrap gap-1">
        {recipe.stickers?.map(s => {
          const [label, cls] = LABELS[s] || [s, 'badge-gray']
          return <span key={s} className={`badge ${cls}`}>{label}</span>
        })}
      </div>
      <div>
        <h4 className="font-medium mt-2">Ingredients</h4>
        <ul className="list-disc ml-6 text-sm">
          {recipe.ingredients?.map((i, idx)=> <li key={idx}>{i}</li>)}
        </ul>
      </div>
      <div>
        <h4 className="font-medium mt-2">Steps</h4>
        <ol className="list-decimal ml-6 text-sm">
          {recipe.steps?.map((s, idx)=> <li key={idx}>{s}</li>)}
        </ol>
      </div>
      {recipe.images?.length > 1 && (
        <div className="flex gap-2 mt-2">
          {recipe.images.slice(1).map((u, idx)=>(
            <img key={idx} src={u} className="w-16 h-16 object-cover rounded-lg border" />
          ))}
        </div>
      )}
    </div>
  )
}
