'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SettingsContent() {
  const [company, setCompany] = useState<{
    id: string
    name: string
    niche: string | null
    brand_voice_profile: string | null
    subscription_tier: string
  } | null>(null)
  const [brandVoice, setBrandVoice] = useState('')
  const [niche, setNiche] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const supabase = createClient()

  const loadSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('company_id, companies(*)')
      .eq('id', user.id)
      .single()

    const companyData = Array.isArray(userData?.companies)
      ? userData?.companies[0]
      : userData?.companies

    if (companyData) {
      setCompany(companyData)
      setBrandVoice(companyData.brand_voice_profile || '')
      setNiche(companyData.niche || '')
    }

    if (userData?.company_id) {
      const { data: tokenData } = await supabase
        .from('google_oauth_tokens')
        .select('account_email')
        .eq('company_id', userData.company_id)
        .single()

      if (tokenData?.account_email) {
        setGoogleConnected(true)
        setGoogleEmail(tokenData.account_email)
      }
    }
  }, [supabase])

  useEffect(() => {
    loadSettings()

    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'google_connected') setMessage('✅ Google Business Profile connected successfully!')
    if (error === 'google_auth_failed') setMessage('❌ Failed to connect Google. Please try again.')
  }, [searchParams, loadSettings])

  const handleSave = async () => {
    if (!company) return
    setSaving(true)

    const { error } = await supabase
      .from('companies')
      .update({
        brand_voice_profile: brandVoice,
        niche,
      })
      .eq('id', company.id)

    setSaving(false)
    setMessage(error ? '❌ Failed to save settings.' : '✅ Settings saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-1">Configure your account and integrations</p>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${message.startsWith('✅') ? 'bg-green-900/40 border border-green-700/50 text-green-300' : 'bg-red-900/40 border border-red-700/50 text-red-300'}`}>
          {message}
        </div>
      )}

      {/* Google Business Profile */}
      <section className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Google Business Profile</h2>
        {googleConnected ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 text-xl">✓</div>
            <div>
              <p className="font-medium text-green-400">Connected</p>
              <p className="text-sm text-slate-400">{googleEmail}</p>
            </div>
            <button
              onClick={() => window.location.href = '/api/google/connect'}
              className="ml-auto text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reconnect
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 text-sm mb-4">Connect your Google Business Profile to sync reviews and post replies.</p>
            <button
              onClick={() => window.location.href = '/api/google/connect'}
              className="bg-white text-slate-900 font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <span>G</span>
              Connect Google Business Profile
            </button>
          </div>
        )}
      </section>

      {/* Brand Voice */}
      <section className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Brand Voice Profile</h2>
        <p className="text-slate-400 text-sm mb-4">Describe your brand&apos;s tone and personality. The AI will use this to generate responses that match your style.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Industry / Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Law firm, Dental clinic, Real estate agency"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Brand Voice Description</label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="e.g. Professional yet approachable. We emphasize trust, expertise and client care. Avoid formal legal jargon. Warm but authoritative."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </section>

      {/* Subscription */}
      <section className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Subscription</h2>
        <p className="text-slate-400 text-sm mb-4">
          Current plan: <span className="text-white font-medium capitalize">{company?.subscription_tier || 'Free'}</span>
        </p>
        {company?.subscription_tier === 'free' && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { plan: 'starter', name: 'Starter', price: '$29/mo', features: '100 reviews · 1 location' },
              { plan: 'professional', name: 'Professional', price: '$79/mo', features: '500 reviews · 5 locations' },
              { plan: 'agency', name: 'Agency', price: '$199/mo', features: 'Unlimited · White-label' },
            ].map((p) => (
              <div key={p.plan} className="bg-slate-700 rounded-lg p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="text-blue-400 font-bold text-lg">{p.price}</p>
                <p className="text-xs text-slate-400 mt-1">{p.features}</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/stripe/create-checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: p.plan }),
                    })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  }}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-sm py-1.5 rounded-lg transition-colors"
                >
                  Upgrade
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
