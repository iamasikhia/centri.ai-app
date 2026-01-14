import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token.web', // Explicitly specify our custom web cookie name
    });

    const isAuthPage = req.nextUrl.pathname === '/'; // Assuming root is the login page/landing

    // If we are on the landing/login page and have a token, redirect to dashboard
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Checking protected routes
    const isProtectedRoute =
        req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/team') ||
        req.nextUrl.pathname.startsWith('/settings');

    if (isProtectedRoute && !token) {
        const signInUrl = new URL('/', req.url); // Redirect to root for signin
        signInUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/team/:path*",
        "/settings/:path*"
    ]
}
