"use client"

import { createContext, useContext, useEffect, useState, useSyncExternalStore, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { User } from "@/lib/types"
import { getLoggedInUser, logout as authLogout, getUserInitials } from "@/lib/auth"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  logout: () => void
  initials: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Simple store for auth state changes
let authListeners = new Set<() => void>()
let currentUser: User | null = null

function subscribeAuth(listener: () => void) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

function getAuthSnapshot() {
  return currentUser
}

function notifyAuthChange() {
  currentUser = getLoggedInUser()
  authListeners.forEach((listener) => listener())
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/"]

// Check if a path is a public route (handles login with query params)
function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/login")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const hasRedirected = useRef(false)
  
  // Use useSyncExternalStore for auth state
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null)

  // Initialize auth state on mount
  useEffect(() => {
    notifyAuthChange()
    setIsLoading(false)
    // Reset redirect flag when user changes
    hasRedirected.current = false
  }, [])

  // Handle redirects
  useEffect(() => {
    if (isLoading) return

    const isPublicRoute = isPublicPath(pathname)
    const isAuthenticated = user !== null

    // Redirect to role picker if not authenticated and on protected route
    if (!isAuthenticated && !isPublicRoute) {
      // Get the role from the protected route to preserve context
      const targetRole = pathname.startsWith("/admin") ? "admin" : "worker"
      router.replace(`/login?role=${targetRole}`)
      return
    }
    
    // Redirect away from login if already authenticated (only once)
    if (isAuthenticated && pathname === "/login" && !hasRedirected.current) {
      hasRedirected.current = true
      // Check if there's a role parameter - redirect to that role's page
      const roleParam = searchParams.get("role")
      
      // Verify user has the correct role for the intended destination
      if (roleParam === "admin" && user.role === "admin") {
        router.replace("/admin/tasks")
      } else if (roleParam === "worker" && user.role === "worker") {
        router.replace("/worker")
      } else {
        // Fallback: redirect based on user's actual role
        if (user.role === "admin") {
          router.replace("/admin/tasks")
        } else {
          router.replace("/worker")
        }
      }
    }
  }, [isLoading, user, pathname, router, searchParams])

  const handleLogout = () => {
    authLogout()
    notifyAuthChange()
    hasRedirected.current = false
    router.push("/")
  }

  const initials = user ? getUserInitials(user.name) : ""

  // Show nothing while checking auth on protected routes
  if (isLoading && !isPublicPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout: handleLogout, initials }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
