import { NextResponse } from "next/server"

// Legacy next-auth route - redirects to new auth system
export async function GET() {
  return NextResponse.redirect(new URL("/login", process.env.VERCEL_URL || "http://localhost:3000"))
}

export async function POST() {
  return NextResponse.json({ error: "This auth endpoint has been deprecated. Please use /api/auth/login instead." }, { status: 410 })
}
