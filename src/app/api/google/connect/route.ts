import { getGoogleAuthUrl } from '@/lib/google'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = getGoogleAuthUrl()
  return NextResponse.redirect(url)
}
