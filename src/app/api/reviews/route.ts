import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'unanswered', 'negative', 'urgent', 'risk'
    const locationId = searchParams.get('locationId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ reviews: [], total: 0 })
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        locations!inner(id, name, company_id)
      `, { count: 'exact' })
      .eq('locations.company_id', userData.company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (filter === 'unanswered') {
      query = query.eq('replied', false)
    } else if (filter === 'negative') {
      query = query.lte('rating', 3)
    } else if (filter === 'risk') {
      query = query.eq('risk_flag', true)
    } else if (filter === 'urgent') {
      query = query.eq('replied', false).lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    }

    const { data: reviews, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reviews, total: count || 0 })
  } catch (err) {
    console.error('Reviews GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
