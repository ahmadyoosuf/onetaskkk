import { NextRequest, NextResponse } from "next/server"
import { createSessionToken, findMockUser, SESSION_COOKIE } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const user = findMockUser(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const token = await createSessionToken(user)
    const redirectTo = user.role === "admin" ? "/admin/tasks" : "/worker"

    const response = NextResponse.json({ ok: true, redirectTo })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
