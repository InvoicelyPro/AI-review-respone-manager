'use client'

import { useState } from 'react'
import { Review } from '@/types/database'
import { formatDate, isOlderThan48Hours } from '@/lib/utils'

interface ReviewWithLocation extends Review {
  locations: { id: string; name: string; company_id: string }
}

interface ReviewCardProps {
  review: ReviewWithLocation
  onReplyPosted: () => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-slate-600'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ReviewCard({ review, onReplyPosted }: ReviewCardProps) {
  const [draft, setDraft] = useState(review.reply_text || '')
  const [generating, setGenerating] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const isUrgent = !review.replied && isOlderThan48Hours(review.created_at)

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/reviews/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: review.id }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setDraft(data.draft)
      setShowEditor(true)
    }
    setGenerating(false)
  }

  const handlePost = async () => {
    if (!draft.trim()) return
    setPosting(true)
    setError('')
    const res = await fetch('/api/reviews/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: review.id, replyText: draft }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      onReplyPosted()
      setShowEditor(false)
    }
    setPosting(false)
  }

  return (
    <div className={`bg-slate-800 border rounded-xl p-6 ${
      review.risk_flag
        ? 'border-red-700/50 bg-red-950/10'
        : isUrgent
        ? 'border-orange-700/50'
        : 'border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.reviewer_name || 'Anonymous'}</span>
            <StarRating rating={review.rating} />
            {review.risk_flag && (
              <span className="bg-red-900/50 text-red-300 text-xs font-medium px-2 py-0.5 rounded-full border border-red-700/50">
                ⚠ Risk flagged
              </span>
            )}
            {isUrgent && (
              <span className="bg-orange-900/50 text-orange-300 text-xs font-medium px-2 py-0.5 rounded-full border border-orange-700/50">
                ⏰ Overdue
              </span>
            )}
            {review.replied && (
              <span className="bg-green-900/50 text-green-300 text-xs font-medium px-2 py-0.5 rounded-full border border-green-700/50">
                ✓ Replied
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
            {review.locations?.name && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{review.locations.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!review.replied && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {generating ? '⟳ Generating...' : '✨ AI Generate'}
            </button>
          )}
          {showEditor && !review.replied && (
            <button
              onClick={() => setShowEditor(false)}
              className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Review text */}
      {review.review_text && (
        <p className="text-slate-300 text-sm leading-relaxed mb-4 bg-slate-900/50 rounded-lg p-3">
          &ldquo;{review.review_text}&rdquo;
        </p>
      )}

      {/* Risk warning */}
      {review.risk_flag && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 mb-4">
          <p className="text-red-300 text-xs font-medium">
            🛡️ Safe Mode active — this review contains sensitive language. Response has been crafted to minimize liability.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700/50 text-red-300 rounded-lg px-3 py-2 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Reply editor */}
      {showEditor && !review.replied && (
        <div className="border-t border-slate-700 pt-4 mt-2">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            AI Draft — Review and edit before posting
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{draft.length} characters</span>
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {posting ? 'Posting...' : '✓ Approve & Post'}
            </button>
          </div>
        </div>
      )}

      {/* Existing reply */}
      {review.replied && review.reply_text && (
        <div className="border-t border-slate-700 pt-4 mt-2">
          <p className="text-xs font-medium text-slate-400 mb-2">Your reply:</p>
          <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">
            {review.reply_text}
          </p>
        </div>
      )}
    </div>
  )
}
