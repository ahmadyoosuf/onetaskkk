import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes - always allow
  const publicRoutes = ["/", "/login"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route) || pathname.startsWith("/login")
  
  if (isPublicRoute) {
    // If logged in and visiting /login, redirect to their role page
    if (session?.user && pathname.startsWith("/login")) {
      const redirectUrl = session.user.role === "admin" ? "/admin/tasks" : "/worker"
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require auth
  if (!session?.user) {
    const role = pathname.startsWith("/admin") ? "admin" : "worker"
    return NextResponse.redirect(new URL(`/login?role=${role}`, request.url))
  }

  // Role-based access control
  const userRole = session.user.role
  const isAdminRoute = pathname.startsWith("/admin")
  const isWorkerRoute = pathname.startsWith("/worker")

  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/worker", request.url))
  }

  if (isWorkerRoute && userRole !== "worker") {
    return NextResponse.redirect(new URL("/admin/tasks", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.jpg|api/auth|.*\\.png$).*)",
  ],
}
