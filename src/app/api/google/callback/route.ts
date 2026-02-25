import { createClient } from '@/lib/supabase/server'
import { getGoogleOAuthClient } from '@/lib/google'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_auth_failed`
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login`
      )
    }

    const oauth2Client = getGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get Google account email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_company`
      )
    }

    // Store tokens
    await supabase
      .from('google_oauth_tokens')
      .upsert({
        company_id: userData.company_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        account_email: googleUser.email,
      }, { onConflict: 'company_id' })

    // Fetch and store locations
    const mybusiness = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: oauth2Client,
    })

    const accountsResponse = await google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    }).accounts.list()

    const accounts = accountsResponse.data.accounts || []

    for (const account of accounts) {
      if (!account.name) continue
      try {
        const locationsResponse = await mybusiness.accounts.locations.list({
          parent: account.name,
          readMask: 'name,title,storefrontAddress',
        })

        const locations = locationsResponse.data.locations || []
        for (const location of locations) {
          if (!location.name) continue
          await supabase.from('locations').upsert({
            company_id: userData.company_id,
            google_location_id: location.name,
            name: location.title || 'Unknown Location',
            address: location.storefrontAddress
              ? [
                  location.storefrontAddress.addressLines?.join(', '),
                  location.storefrontAddress.locality,
                  location.storefrontAddress.regionCode,
                ].filter(Boolean).join(', ')
              : null,
          }, { onConflict: 'google_location_id' })
        }
      } catch {
        // Skip accounts without location access
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=google_connected`
    )
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_auth_failed`
    )
  }
}
