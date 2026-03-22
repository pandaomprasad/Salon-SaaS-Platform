'use client'

import { useState } from 'react'
import { ADMIN_USERS } from '@/lib/data'
import { AdminUser } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react'

interface LoginPageProps {
  onLogin: (user: AdminUser) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function handleLogin() {
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = ADMIN_USERS.find(
        u => u.email === email.trim().toLowerCase() && u.password === password
      )
      if (user) {
        onLogin(user)
      } else {
        setError('Invalid email or password.')
        setLoading(false)
      }
    }, 600)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Salon HQ</p>
            <p className="text-slate-500 text-[11px]">Admin Panel</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your entire<br />
            salon network<br />
            from one place.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Monitor performance, manage subscriptions, and oversee all salons across the platform in real time.
          </p>

          {/* Platform stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Salons',    value: '10'   },
              { label: 'Bookings',  value: '1.4k' },
              { label: 'Customers', value: '703'  },
            ].map(s => (
              <div key={s.label} className="bg-slate-800 rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo credentials */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Demo Credentials
          </p>
          <div className="space-y-2">
            {ADMIN_USERS.map(u => (
              <div
                key={u.id}
                onClick={() => {
                  setEmail(u.email)
                  setPassword(u.password)
                  setError('')
                }}
                className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 cursor-pointer transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-[11px] text-slate-500">{u.email} · {u.password}</p>
                </div>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  Click to fill →
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Salon HQ</p>
              <p className="text-slate-400 text-[11px]">Admin Panel</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-8">
            Sign in to your admin account to continue.
          </p>

          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <Input
              label="Email"
              type="email"
              placeholder="you@salonhq.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              icon={<Mail size={14} />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              icon={<Lock size={14} />}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleLogin}
              loading={loading}
            >
              Sign In to Admin Panel
            </Button>
          </div>

          {/* Mobile demo credentials */}
          <div className="lg:hidden mt-6 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Demo Credentials
            </p>
            {ADMIN_USERS.map(u => (
              <div
                key={u.id}
                onClick={() => {
                  setEmail(u.email)
                  setPassword(u.password)
                  setError('')
                }}
                className="text-xs text-slate-500 cursor-pointer hover:text-slate-800 transition-colors py-1"
              >
                <span className="font-medium">{u.name}:</span> {u.email} / {u.password}
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}