"use client"

import { createContext, useContext } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getUserInitials } from "@/lib/mock-users"

interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "worker"
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  logout: () => void
  initials: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const isLoading = status === "loading"
  
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }
    : null

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const initials = user ? getUserInitials(user.name) : ""

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
