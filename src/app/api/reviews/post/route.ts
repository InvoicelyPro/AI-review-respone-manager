import { createClient } from '@/lib/supabase/server'
import { getGoogleOAuthClient } from '@/lib/google'
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId, replyText } = await request.json()

    if (!reviewId || !replyText) {
      return NextResponse.json({ error: 'reviewId and replyText required' }, { status: 400 })
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

    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const oauth2Client = getGoogleOAuthClient()
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsApi = (google as any).mybusinessreviews({
      version: 'v1',
      auth: oauth2Client,
    })

    await reviewsApi.locations.reviews.updateReply({
      name: review.google_review_id,
      requestBody: {
        comment: replyText,
      },
    })

    // Update review as replied
    await supabase
      .from('reviews')
      .update({
        replied: true,
        reply_text: replyText,
        reply_posted_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Post reply error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
