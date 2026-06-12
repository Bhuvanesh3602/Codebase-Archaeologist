import { useState } from 'react'
import logo from '../../logo.png'
import { User } from '../types'
import { MOCK_USER } from '../data/mock'

interface LoginViewProps {
  onLogin: (user: User) => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(MOCK_USER)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <img src={logo} alt="Red Team Agent" className="h-32 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
          <p className="text-zinc-500 text-sm mb-6">Access your Red Team workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-center text-zinc-600 text-xs">
              Single Sign-On available for enterprise accounts
            </p>
            <button className="w-full mt-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors border border-zinc-700">
              Continue with SSO
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          Red Team Agent — Adversarial Strategic Analysis
        </p>
      </div>
    </div>
  )
}
