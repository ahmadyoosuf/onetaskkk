"use client"

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  // Use useSyncExternalStore for auth state
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null)

  // Initialize auth state on mount
  useEffect(() => {
    currentUser = getLoggedInUser()
    setIsLoading(false)
  }, [])

  // Handle redirects
  useEffect(() => {
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    const isAuthenticated = user !== null

    // Redirect to login if not authenticated and on protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login")
    }
    
    // Redirect away from login if already authenticated
    if (isAuthenticated && pathname === "/login") {
      if (user?.role === "admin") {
        router.push("/admin/tasks")
      } else {
        router.push("/worker")
      }
    }
  }, [isLoading, user, pathname, router])

  const handleLogout = () => {
    authLogout()
    notifyAuthChange()
    router.push("/login")
  }

  const initials = user ? getUserInitials(user.name) : ""

  // Show nothing while checking auth on protected routes
  if (isLoading && !PUBLIC_ROUTES.includes(pathname)) {
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
