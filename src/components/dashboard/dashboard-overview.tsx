'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
  responseRate: number
  avgResponseTimeHours: number
  negativeReviews: number
  urgentReviews: number
  monthlyVolume: number
  riskReviews: number
  totalReviews: number
  repliedReviews: number
}

export default function DashboardOverview({ companyId }: { companyId?: string | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-xl p-6 animate-pulse h-28" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      label: 'Response Rate',
      value: `${stats.responseRate}%`,
      sub: `${stats.repliedReviews} of ${stats.totalReviews} reviews`,
      color: stats.responseRate >= 80 ? 'text-green-400' : stats.responseRate >= 50 ? 'text-yellow-400' : 'text-red-400',
      icon: '📈',
    },
    {
      label: 'Avg Response Time',
      value: stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours}h` : 'N/A',
      sub: 'Average time to reply',
      color: 'text-blue-400',
      icon: '⏱️',
    },
    {
      label: 'Urgent Reviews',
      value: stats.urgentReviews.toString(),
      sub: 'Unanswered >48 hours',
      color: stats.urgentReviews > 0 ? 'text-orange-400' : 'text-green-400',
      icon: '⚠️',
    },
    {
      label: 'Risk Flagged',
      value: stats.riskReviews.toString(),
      sub: 'Require careful response',
      color: stats.riskReviews > 0 ? 'text-red-400' : 'text-green-400',
      icon: '🛡️',
    },
    {
      label: 'Negative Reviews',
      value: stats.negativeReviews.toString(),
      sub: '1–3 stars, unanswered',
      color: stats.negativeReviews > 0 ? 'text-red-400' : 'text-green-400',
      icon: '⭐',
    },
    {
      label: 'Monthly Volume',
      value: stats.monthlyVolume.toString(),
      sub: 'Reviews this month',
      color: 'text-purple-400',
      icon: '📅',
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm font-medium text-white mt-1">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {(stats.urgentReviews > 0 || stats.riskReviews > 0) && (
        <div className="mt-6 bg-orange-900/20 border border-orange-700/30 rounded-xl p-4">
          <p className="text-orange-300 font-medium text-sm">
            ⚠️ Action needed:{' '}
            {stats.urgentReviews > 0 && `${stats.urgentReviews} review${stats.urgentReviews !== 1 ? 's' : ''} waiting over 48 hours`}
            {stats.urgentReviews > 0 && stats.riskReviews > 0 && ' · '}
            {stats.riskReviews > 0 && `${stats.riskReviews} risk-flagged review${stats.riskReviews !== 1 ? 's' : ''} need careful handling`}
          </p>
          <a href="/inbox?filter=urgent" className="text-orange-400 hover:text-orange-300 text-sm underline mt-1 inline-block">
            Go to inbox →
          </a>
        </div>
      )}
    </div>
  )
}
