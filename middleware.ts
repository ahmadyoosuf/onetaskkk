import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: [
    // Match all routes except static files and api routes that don't need auth
    "/((?!_next/static|_next/image|favicon.ico|favicon.jpg|.*\\.png$).*)",
  ],
}
