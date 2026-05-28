import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const response = NextResponse.redirect(origin + '/')
    
    // Dynamic cookie deletion for all Supabase cookies
    allCookies.forEach(c => {
      if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
        response.cookies.set(c.name, '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      }
    })
    
    return response
  } catch (error) {
    return NextResponse.redirect(origin + '/')
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const response = NextResponse.json({ success: true })
    
    // Dynamic cookie deletion for all Supabase cookies
    allCookies.forEach(c => {
      if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
        response.cookies.set(c.name, '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      }
    })
    
    return response
  } catch (error) {
    return NextResponse.json({ error: '로그아웃 실패' }, { status: 500 })
  }
}
