import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ✅ AUTH PROTECTION LOGIC
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isSubscribePage = pathname.startsWith('/dashboard/subscribe')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // ✅ TRIAL & SUBSCRIPTION CHECK
  if (isProtectedRoute && user && !isSubscribePage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at, subscription_status, active_plan, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Admins have full access
      if (profile.role === 'admin') return response

      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
      const now = new Date()
      const isTrialExpired = trialEndsAt ? trialEndsAt < now : true
      const isNotActive = profile.subscription_status !== 'active'
      const hasPaidPlan = profile.active_plan && profile.active_plan.toLowerCase() !== 'free'

      // Only redirect if trial is expired AND subscription is not active AND there is no paid plan
      if (isTrialExpired && isNotActive && !hasPaidPlan) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/subscribe'
        return NextResponse.redirect(url)
      }
    }
  }

  // ✅ REDIRECT LOGGED IN USERS AWAY FROM AUTH PAGES
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
