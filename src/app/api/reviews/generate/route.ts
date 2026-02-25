import { createClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await request.json()

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    }

    // Get user's company info
    const { data: userData } = await supabase
      .from('users')
      .select(`
        company_id,
        companies(name, niche, brand_voice_profile, subscription_tier)
      `)
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 400 })
    }

    const company = Array.isArray(userData.companies)
      ? userData.companies[0]
      : userData.companies

    // Check subscription (basic gating)
    if (company?.subscription_tier === 'free') {
      // Check monthly usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      if ((count || 0) >= 10) {
        return NextResponse.json({
          error: 'Free tier limit reached. Please upgrade your plan.',
          code: 'LIMIT_REACHED',
        }, { status: 402 })
      }
    }

    // Get review
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const { draft, tokensUsed, costEstimate } = await generateReviewResponse({
      reviewText: review.review_text || '',
      rating: review.rating,
      brandVoiceProfile: company?.brand_voice_profile || '',
      reviewerName: review.reviewer_name || 'Customer',
      riskFlag: review.risk_flag,
      companyName: company?.name || '',
      niche: company?.niche || '',
    })

    // Log AI usage
    await supabase.from('ai_logs').insert({
      review_id: reviewId,
      draft_text: draft,
      tokens_used: tokensUsed,
      cost_estimate: costEstimate,
      model: 'gpt-4o-mini',
    })

    return NextResponse.json({ draft, tokensUsed, costEstimate })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
