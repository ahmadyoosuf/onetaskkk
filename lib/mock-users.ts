import type { User } from "./types"

// Mock users for demonstration
export const MOCK_USERS: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@onetaskkk.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", role: "worker" },
  { id: "user-3", name: "Carol Davis", email: "carol@example.com", role: "worker" },
]

/**
 * Get initials from a user name
 */
export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
