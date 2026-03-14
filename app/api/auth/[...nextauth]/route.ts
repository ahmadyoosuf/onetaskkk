import { NextResponse } from "next/server"

// Legacy catch-all route stub — auth is handled by /api/auth/login, /api/auth/logout, /api/auth/session
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
