import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
      return NextResponse.json({
        responseRate: 0,
        avgResponseTimeHours: 0,
        negativeReviews: 0,
        urgentReviews: 0,
        monthlyVolume: 0,
        recentReviews: [],
        riskReviews: 0,
      })
    }

    // Get all reviews for the company
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, locations!inner(company_id)')
      .eq('locations.company_id', userData.company_id)

    if (!reviews) {
      return NextResponse.json({
        responseRate: 0,
        avgResponseTimeHours: 0,
        negativeReviews: 0,
        urgentReviews: 0,
        monthlyVolume: 0,
        recentReviews: [],
        riskReviews: 0,
      })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const totalReviews = reviews.length
    const repliedReviews = reviews.filter(r => r.replied).length
    const responseRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 0

    const negativeReviews = reviews.filter(r => r.rating <= 3 && !r.replied).length
    const urgentReviews = reviews.filter(r =>
      !r.replied && new Date(r.created_at) < fortyEightHoursAgo
    ).length
    const monthlyVolume = reviews.filter(r =>
      new Date(r.created_at) >= startOfMonth
    ).length
    const riskReviews = reviews.filter(r => r.risk_flag && !r.replied).length

    // Calculate average response time (for replied reviews)
    const repliedWithTime = reviews.filter(r => r.replied && r.reply_posted_at)
    const avgResponseTimeHours = repliedWithTime.length > 0
      ? Math.round(
          repliedWithTime.reduce((sum, r) => {
            const created = new Date(r.created_at).getTime()
            const replied = new Date(r.reply_posted_at!).getTime()
            return sum + (replied - created) / (1000 * 60 * 60)
          }, 0) / repliedWithTime.length
        )
      : 0

    return NextResponse.json({
      responseRate,
      avgResponseTimeHours,
      negativeReviews,
      urgentReviews,
      monthlyVolume,
      riskReviews,
      totalReviews,
      repliedReviews,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
