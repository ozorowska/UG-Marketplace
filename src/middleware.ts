import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// middleware z autoryzacją next-auth - WERSJA UPROSZCZONA
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token // token JWT z sesji next-auth
    const url = req.nextUrl // aktualny adres URL

    // jeśli użytkownik nie jest zalogowany i próbuje wejść na chronione ścieżki → przekieruj na /login
    if (!token && (
      url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/myoffers") ||
      url.pathname.startsWith("/favorites") ||
      url.pathname.startsWith("/messages") ||
      url.pathname.startsWith("/profile")
    )) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // w innych przypadkach przepuść dalej
    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/login", // domyślna strona logowania używana przez next-auth
    },
  }
)

// konfiguracja matcherów – ścieżki, które będą obsługiwane przez middleware

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/myoffers/:path*",
    "/favorites/:path*",
    "/messages/:path*",
    "/profile/:path*",
  ],
}