import React, { useState } from 'react'
import { api } from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState('login') // or register
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'register') await api('/api/register', { method: 'POST', body: JSON.stringify({ username }) })
      await api('/api/login', { method: 'POST', body: JSON.stringify({ username }) })
      localStorage.setItem('username', username)
      onLogin()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white border rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold">Welcome to GF App</h2>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full rounded-lg bg-black text-white py-2">{mode === 'login' ? 'Login' : 'Register'}</button>
        <div className="text-sm text-gray-600 text-center">
          {mode === 'login' ? (
            <span>New here? <button type="button" className="underline" onClick={()=>setMode('register')}>Create an account</button></span>
          ) : (
            <span>Have an account? <button type="button" className="underline" onClick={()=>setMode('login')}>Login</button></span>
          )}
        </div>
      </form>
    </div>
  )
}
