import { NextResponse } from "next/server"

// This catch-all route exists solely to satisfy the file system.
// The real auth endpoints are /api/auth/login, /api/auth/logout, /api/auth/session.
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
