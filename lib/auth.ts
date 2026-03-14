import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { MOCK_USERS } from "./mock-users"
import type { User } from "./types"
import { SESSION_COOKIE, SECRET } from "./auth-constants"

/**
 * Create a signed JWT for the given user (used by login route)
 */
export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)
}

/**
 * Get the current session user from cookies (server components / route handlers).
 * Uses basic JWT payload parsing (no cryptographic verification) to reduce latency
 * in this mock environment. The middleware already guards routes.
 */
export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    if (!payload.id || !payload.role) return null
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as "admin" | "worker",
    }
  } catch {
    return null
  }
}

/**
 * Look up a mock user by ID
 */
export function findMockUser(userId: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === userId)
}

export { SESSION_COOKIE, SECRET, MOCK_USERS }
export { getUserInitials } from "./mock-users"
