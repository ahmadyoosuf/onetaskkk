"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListTodo, ClipboardCheck, PlusCircle, ArrowLeftRight, LogOut, User } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
  const { user, logout, initials } = useAuth()
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

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0 touch-feedback"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Switch</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="User menu"
                >
                  {initials || <User className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs">
                      <Badge variant="outline" className="mr-2 text-[10px] capitalize">
                        {user.role}
                      </Badge>
                      Current Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
