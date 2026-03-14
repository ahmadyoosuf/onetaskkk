"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LogIn, ShieldCheck, ListTodo, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_USERS } from "@/lib/mock-users"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role") as "worker" | "admin" | null
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(() => {})
  }, [])

  // Filter users based on the selected role from URL parameter
  const filteredUsers = useMemo(() => {
    if (!roleParam) return MOCK_USERS
    return MOCK_USERS.filter((user) => user.role === roleParam)
  }, [roleParam])

  const roleLabel = roleParam === "admin" ? "Admin" : roleParam === "worker" ? "Worker" : null

  const selectedUser = filteredUsers.find((u) => u.id === selectedUserId)

  // Determine redirect URL based on selected user's role
  const callbackUrl = selectedUser
    ? selectedUser.role === "admin" ? "/admin/tasks" : "/worker"
    : "/"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Back to role selection */}
      {roleParam && (
        <Link 
          href="/" 
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      )}
      
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/favicon.jpg"
          alt="onetaskkk logo"
          width={48}
          height={48}
          className="rounded-2xl shadow-md"
        />
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">onetaskkk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-border/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg">
            {roleLabel ? `Sign in as ${roleLabel}` : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {roleLabel 
              ? `Select a ${roleLabel.toLowerCase()} account to continue`
              : "Select a demo account to continue"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Choose an account</Label>
            <div className="grid gap-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id
                const Icon = user.role === "admin" ? ShieldCheck : ListTodo
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/40 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                      user.role === "admin" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "shrink-0 text-xs capitalize",
                        user.role === "admin" 
                          ? "border-primary/30 text-primary" 
                          : "border-border/30"
                      )}
                    >
                      {user.role}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mock Login Form (pre-filled, read-only for demo) */}
          {selectedUser && (
            <div className="space-y-4 rounded-lg border border-border/30 bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground text-center">
                Demo credentials (pre-filled)
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedUser.email}
                    readOnly
                    className="bg-background h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value="demo-password-123"
                    readOnly
                    className="bg-background h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit via direct form POST — bypasses the broken signIn server action on Next.js 16 */}
          <form
            action="/api/auth/callback/credentials"
            method="POST"
            onSubmit={() => setIsLoading(true)}
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="userId" value={selectedUserId ?? ""} />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button
              type="submit"
              disabled={!selectedUserId || isLoading || !csrfToken}
              className="w-full h-11"
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            This is a demo app using Auth.js for session management.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
