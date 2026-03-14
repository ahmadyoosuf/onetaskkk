import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { MOCK_USERS } from "./mock-users"

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Demo Account",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string
        if (!userId) return null

        const user = MOCK_USERS.find((u) => u.id === userId)
        if (!user) return null

        // Return user object for session
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add role to token on sign in
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add role and id to session
      if (session.user) {
        session.user.role = token.role as "admin" | "worker"
        session.user.id = token.id as string
      }
      return session
    },

  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
}
