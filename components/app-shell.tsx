"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListTodo, ClipboardCheck, PlusCircle } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Feed", icon: ListTodo, role: "worker" },
  { href: "/admin/composer", label: "Compose", icon: PlusCircle, role: "admin" },
  { href: "/admin/tasks", label: "Tasks", icon: LayoutDashboard, role: "admin" },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardCheck, role: "admin" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Glass Header */}
      <header
        className="sticky top-0 z-50 glass border-b border-border/30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between px-3 sm:px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 touch-feedback">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              T
            </span>
            <span className="hidden sm:inline text-lg font-semibold tracking-tight">TaskMarket</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href))
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors touch-feedback whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="h-2 w-2 rounded-full bg-success animate-breathe" />
            <span className="hidden sm:inline text-xs text-muted-foreground">Demo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
