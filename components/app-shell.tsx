"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListTodo, ClipboardCheck, PlusCircle } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Tasks Feed", icon: ListTodo, role: "worker" },
  { href: "/admin/composer", label: "Task Composer", icon: PlusCircle, role: "admin" },
  { href: "/admin/tasks", label: "Tasks Management", icon: LayoutDashboard, role: "admin" },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardCheck, role: "admin" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Glass Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm sm:text-base">
              Y
            </span>
            <span className="hidden xs:inline text-lg sm:text-xl font-semibold tracking-tight">Yoke</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href))
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="h-2 w-2 rounded-full bg-success animate-breathe" />
            <span className="hidden sm:inline text-xs sm:text-sm text-muted-foreground">Demo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
