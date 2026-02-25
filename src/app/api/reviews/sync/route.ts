import { createClient } from '@/lib/supabase/server'
import { getGoogleOAuthClient, starRatingToNumber } from '@/lib/google'
import { detectRisk, detectSentiment } from '@/lib/risk-detection'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 400 })
    }

    const { data: tokenData } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('company_id', userData.company_id)
      .single()

    if (!tokenData?.access_token) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 400 })
    }

    const oauth2Client = getGoogleOAuthClient()
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    })

    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .eq('company_id', userData.company_id)

    if (!locations?.length) {
      return NextResponse.json({ message: 'No locations to sync', synced: 0 })
    }

    let totalSynced = 0

    for (const location of locations) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reviewsApi = (google as any).mybusinessreviews({
          version: 'v1',
          auth: oauth2Client,
        })

        const response = await reviewsApi.locations.reviews.list({
          parent: location.google_location_id,
          pageSize: 50,
        })

        const googleReviews = response.data.reviews || []

        for (const review of googleReviews) {
          if (!review.name) continue

          const rating = starRatingToNumber(review.starRating || 'ONE')
          const reviewText = review.comment || ''
          const riskFlag = detectRisk(reviewText)
          const sentimentTag = detectSentiment(rating)

          await supabase.from('reviews').upsert({
            location_id: location.id,
            google_review_id: review.name,
            rating,
            reviewer_name: review.reviewer?.displayName || 'Anonymous',
            review_text: reviewText,
            created_at: review.createTime || new Date().toISOString(),
            replied: !!review.reviewReply?.comment,
            reply_text: review.reviewReply?.comment || null,
            risk_flag: riskFlag,
            sentiment_tag: sentimentTag,
          }, { onConflict: 'google_review_id' })

          totalSynced++
        }
      } catch (locationError) {
        console.error(`Error syncing location ${location.id}:`, locationError)
      }
    }

    return NextResponse.json({ message: 'Sync complete', synced: totalSynced })
  } catch (err) {
    console.error('Review sync error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
