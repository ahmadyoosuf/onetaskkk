"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  /**
   * "icon"  — compact icon-only cycle button (for header)
   * "menu"  — three labelled buttons in a row (for settings dropdown)
   */
  variant?: "icon" | "menu"
}

const THEMES = [
  { value: "light",  label: "Light",  Icon: Sun     },
  { value: "dark",   label: "Dark",   Icon: Moon    },
  { value: "system", label: "System", Icon: Monitor },
] as const

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  if (variant === "menu") {
    return (
      <div className={cn("flex items-center gap-1 rounded-lg border border-border/40 p-1", className)}>
        {THEMES.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={`Set ${label} theme`}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors touch-target-sm",
              theme === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    )
  }

  // icon variant — cycles light → dark → system
  const cycle: Record<string, string> = { light: "dark", dark: "system", system: "light" }
  const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <button
      onClick={() => setTheme(cycle[theme] as "light" | "dark" | "system")}
      aria-label="Toggle theme"
      className={cn(
        "flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground touch-target-sm",
        className
      )}
    >
      <ActiveIcon className="h-4 w-4" />
    </button>
  )
}
