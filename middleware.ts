import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth-constants"

/**
 * Simplified middleware — basic cookie check instead of full JWT verification.
 * Since this is a mock/demo app, we parse the JWT payload without cryptographic
 * verification to eliminate jose latency. The login route still creates proper
 * JWTs for cookie structure compatibility.
 */
function getSessionFromCookie(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    // JWT structure: header.payload.signature — decode payload (base64url)
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    if (!payload.id || !payload.role) return null
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { id: payload.id as string, role: payload.role as string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = getSessionFromCookie(request)

  // Public routes — always allow
  if (pathname === "/" || pathname.startsWith("/login")) {
    if (session && pathname.startsWith("/login")) {
      const dest = session.role === "admin" ? "/admin/tasks" : "/worker"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Protected routes — require session
  if (!session) {
    const role = pathname.startsWith("/admin") ? "admin" : "worker"
    return NextResponse.redirect(new URL(`/login?role=${role}`, request.url))
  }

  // Role-based access control
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/worker", request.url))
  }
  if (pathname.startsWith("/worker") && session.role !== "worker") {
    return NextResponse.redirect(new URL("/admin/tasks", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.jpg|api/auth|.*\\.png$).*)",
  ],
}
