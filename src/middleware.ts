// src/middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const url = req.nextUrl

    console.log("Middleware running")
    console.log("Token:", token)
    console.log("Pathname:", url.pathname)

    // ZALOGOWANI użytkownicy → przekierowanie na /dashboard z /login, /register
    if (token && (url.pathname.startsWith("/login") || url.pathname.startsWith("/register"))) {
      console.log("Authenticated user accessing public route:", url.pathname)
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // NIEZALOGOWANI użytkownicy → przekierowanie na /login z /dashboard
    if (!token && url.pathname.startsWith("/dashboard")) {
      console.log("Unauthenticated user accessing protected route:", url.pathname)
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Inne przypadki → przepuszczamy dalej
    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/login",
    // "/register",
    // "/",
    "/dashboard/:path*",
  ],
}
