"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { NuqsAdapter } from "nuqs/adapters/next/app"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <NuqsAdapter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NuqsAdapter>
      </QueryProvider>
    </ThemeProvider>
  )
}
