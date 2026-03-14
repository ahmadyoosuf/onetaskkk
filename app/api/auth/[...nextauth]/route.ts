// This catch-all route exists only to prevent stale cache errors.
// All auth is handled by /api/auth/login, /api/auth/logout, /api/auth/session.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
