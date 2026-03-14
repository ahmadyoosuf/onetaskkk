import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "onetaskkk-session"
const SECRET = new TextEncoder().encode("onetaskkk-demo-secret-key-min-32chars!")

async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { id: payload.id as string, role: payload.role as string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSessionFromRequest(request)

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
