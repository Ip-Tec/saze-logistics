// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr'; // Import for server-side client

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Create a Supabase client configured to use cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the session and update the cookies on the response
  // This is the crucial step that makes the session available to server components
  await supabase.auth.getSession();

  return response;
}

// Optionally, specify matcher to run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (your auth routes)
     * - api (your API routes if any)
     * - You might want to add other public assets like /fonts, /images, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|api).*)',
  ],
};