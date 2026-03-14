import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Re-export mock users and utilities for convenience
export { MOCK_USERS, getUserInitials } from "./mock-users"
