import type { User } from "./types"

const AUTH_STORAGE_KEY = "taskmarket_auth_user"

// Mock users for demonstration
export const MOCK_USERS: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@onetaskkk.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", role: "worker" },
  { id: "user-3", name: "Carol Davis", email: "carol@example.com", role: "worker" },
]

/**
 * Get the currently logged-in user from localStorage
 */
export function getLoggedInUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

/**
 * Log in as a specific user (mock auth)
 */
export function loginAs(userId: string): User | null {
  const user = MOCK_USERS.find((u) => u.id === userId)
  if (!user) return null
  
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  }
  return user
}

/**
 * Log out the current user
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getLoggedInUser() !== null
}

/**
 * Get initials from a user name
 */
export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
