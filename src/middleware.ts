import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create response object FIRST to allow cookie modifications
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookie = request.cookies.get(name);
            return cookie?.value;
          },
          set: (name: string, value: string, options: CookieOptions) => {
            response.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: CookieOptions) => {
             // Ensure options is always an object
             const opts = options || {};
            response.cookies.delete({ name, ...opts });
          },
        },
      }
    );

    // IMPORTANT: Avoid processing for static assets or API routes early
    const { pathname } = request.nextUrl;
     const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/api') || /\.(.*)$/.test(pathname);
    if (isStaticAsset) {
      return response;
    }

    // Attempt to get the session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AUTH] Error getting session:', error.message);
      // Allow request to proceed but session will be null
    }

    // --- Route Handling ---

    // Redirect logged-in users away from login page
    if (session && pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow callback route to proceed (Supabase client handles session creation here)
    // But if a user somehow hits callback while logged in, redirect them
    if (pathname === '/auth/callback') {
       return response; // Return potentially modified response with cookies
    }

    // Protect dashboard routes: redirect to login if no session
    if (!session && pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle root path '/': redirect based on session
    if (pathname === '/') {
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // If none of the above, allow the request but return the potentially modified response
    return response;

  } catch (e) {
    console.error('[AUTH] Unexpected middleware error:', e);
    // Return the initial 'next()' response in case of unexpected errors
     return response;
  }
}

// Updated Matcher (more standard)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (assuming you have an assets folder)
     * - *.png, *.svg etc (other static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 