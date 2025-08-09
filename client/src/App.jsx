import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RecipeEditor from './pages/RecipeEditor'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'editor'
  const [editing, setEditing] = useState(null)

  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null
  useEffect(() => { if (!username) { /* stay on login */ } }, [username])

  if (!username) return <Login onLogin={() => window.location.reload()} />

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">GF App</h1>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-600" onClick={()=>{localStorage.removeItem('username'); window.location.reload()}}>Logout</button>
            <button className="px-3 py-1.5 rounded-lg bg-black text-white text-sm" onClick={()=>{setEditing(null); setPage('editor')}}>+ New Recipe</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {page === 'dashboard' && <Dashboard onEdit={(r)=>{setEditing(r); setPage('editor')}} />}
        {page === 'editor' && <RecipeEditor recipe={editing} onBack={()=>setPage('dashboard')} />}
      </main>
    </div>
  )
}
