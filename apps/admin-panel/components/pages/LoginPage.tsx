'use client'

import { useState } from 'react'
import apiClient, { tokenStorage } from '@/lib/api-client'
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

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const u = data.data?.user
      const accessToken = data.data?.accessToken
      const refreshToken = data.data?.refreshToken

      if (!u || !accessToken) {
        throw new Error('Invalid response from server.')
      }

      if (u.role !== 'superadmin') {
        setError('Access denied. Superadmin account required.')
        setLoading(false)
        return
      }

      tokenStorage.setTokens(accessToken, refreshToken || '')

      const adminUser: AdminUser = {
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        initials: u.name ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AD',
      }

      onLogin(adminUser)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid email or password.'
      setError(msg)
      setLoading(false)
    }
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

        {/* Footer info */}
        <div className="text-xs text-slate-500">
          Protected Administrative Portal · ST CUT Platform
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
        </div>
      </div>

    </div>
  )
}