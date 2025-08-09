import React, { useState } from 'react'
import Dashboard from './pages/Dashboard'
import RecipeEditor from './pages/RecipeEditor'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'editor'
  const [editing, setEditing] = useState(null)

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">GF App</h1>
          <button className="px-3 py-1.5 rounded-lg bg-black text-white text-sm" onClick={()=>{setEditing(null); setPage('editor')}}>
            + New Recipe
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {page === 'dashboard' && <Dashboard onEdit={(r)=>{setEditing(r); setPage('editor')}} />}
        {page === 'editor' && <RecipeEditor recipe={editing} onBack={()=>setPage('dashboard')} />}
      </main>
    </div>
  )
}
