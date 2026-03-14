import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: "admin" | "worker"
  }

  interface Session {
    user: {
      id: string
      role: "admin" | "worker"
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "worker"
    id?: string
  }
}
