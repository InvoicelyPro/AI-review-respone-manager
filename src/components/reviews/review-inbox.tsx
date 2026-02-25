'use client'

import { useEffect, useState, useCallback } from 'react'
import ReviewCard from './review-card'
import { Review } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface ReviewWithLocation extends Review {
  locations: { id: string; name: string; company_id: string }
}

function ReviewInboxContent() {
  const [reviews, setReviews] = useState<ReviewWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [total, setTotal] = useState(0)
  const searchParams = useSearchParams()

  const fetchReviews = useCallback(async (f: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f !== 'all') params.set('filter', f)
    const res = await fetch(`/api/reviews?${params}`)
    const data = await res.json()
    setReviews(data.reviews || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const urlFilter = searchParams.get('filter') || 'all'
    setFilter(urlFilter)
    fetchReviews(urlFilter)
  }, [searchParams, fetchReviews])

  const handleSync = async () => {
    setSyncing(true)
    await fetch('/api/reviews/sync', { method: 'POST' })
    await fetchReviews(filter)
    setSyncing(false)
  }

  const handleReplyPosted = (reviewId: string) => {
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, replied: true } : r
    ))
  }

  const filters = [
    { id: 'all', label: 'All reviews' },
    { id: 'unanswered', label: 'Unanswered' },
    { id: 'negative', label: '1–3 stars' },
    { id: 'urgent', label: '>48h old' },
    { id: 'risk', label: 'Risk flagged' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id)
                fetchReviews(f.id)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {syncing ? '⟳ Syncing...' : '⟳ Sync reviews'}
        </button>
      </div>

      <p className="text-sm text-slate-400 mb-4">{total} review{total !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-400">No reviews found for this filter</p>
          <p className="text-slate-500 text-sm mt-1">Try syncing your reviews or changing the filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReplyPosted={() => handleReplyPosted(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReviewInbox() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading inbox...</div>}>
      <ReviewInboxContent />
    </Suspense>
  )
}
