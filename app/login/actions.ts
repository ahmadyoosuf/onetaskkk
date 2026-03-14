"use server"

import { signIn } from "@/lib/auth"
import { MOCK_USERS } from "@/lib/mock-users"
import { AuthError } from "next-auth"

export async function loginAction(userId: string) {
  const user = MOCK_USERS.find((u) => u.id === userId)
  if (!user) {
    return { error: "User not found" }
  }

  try {
    await signIn("credentials", {
      userId,
      redirect: false,
    })
    
    return { 
      success: true, 
      redirectTo: user.role === "admin" ? "/admin/tasks" : "/worker" 
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Sign in failed. Please try again." }
    }
    // NEXT_REDIRECT is thrown by signIn on success — rethrow it
    throw error
  }
}
