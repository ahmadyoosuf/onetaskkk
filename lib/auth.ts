import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { MOCK_USERS } from "./mock-users"
import type { User } from "./types"
import { SESSION_COOKIE, SECRET } from "./auth-constants"

/**
 * Create a signed JWT for the given user
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
 * Verify a JWT and return the user payload, or null if invalid
 */
export async function verifySessionToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
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
 * Get the current session user from cookies (server components / route handlers)
 */
export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Look up a mock user by ID
 */
export function findMockUser(userId: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === userId)
}

export { SESSION_COOKIE, SECRET, MOCK_USERS }
export { getUserInitials } from "./mock-users"
