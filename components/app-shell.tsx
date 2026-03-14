"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListTodo, ClipboardCheck, PlusCircle, ArrowLeftRight } from "lucide-react"

type AppRole = "worker" | "admin"

const NAV_ITEMS: Record<AppRole, { href: string; label: string; icon: typeof ListTodo }[]> = {
  worker: [
    { href: "/worker", label: "Feed", icon: ListTodo },
  ],
  admin: [
    { href: "/admin/composer", label: "Compose", icon: PlusCircle },
    { href: "/admin/tasks", label: "Tasks", icon: LayoutDashboard },
    { href: "/admin/submissions", label: "Submissions", icon: ClipboardCheck },
  ],
}

interface AppShellProps {
  children: React.ReactNode
  role?: AppRole
}

export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname()
  const activeRole: AppRole = role ?? (pathname.startsWith("/admin") ? "admin" : "worker")
  const navItems = NAV_ITEMS[activeRole]

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
            <Image
              src="/favicon.jpg"
              alt="onetaskkk logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="hidden sm:inline text-lg font-semibold tracking-tight">onetaskkk</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/worker" && pathname.startsWith(item.href))
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

          {/* Switch Role */}
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0 touch-feedback"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Switch Role</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
