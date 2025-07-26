import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    if (req.nextUrl.pathname === "/" && token) {
      return NextResponse.redirect(new URL("/app", req.url))
    }

    if (req.nextUrl.pathname.startsWith("/app")) {
      if (!token) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = { 
  matcher: [
    "/",
    "/app",
    "/api/:path*"
  ]
}