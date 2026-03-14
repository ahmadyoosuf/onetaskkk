import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ImgHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { User } from "@/lib/types"
import LoginPage from "../page"

const mockPush = vi.fn()
const mockRefresh = vi.fn()

const mockUsers: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@onetaskkk.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
]

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/mock-users", () => ({
  MOCK_USERS: mockUsers,
}))

// Mock fetch for auth API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("LoginPage", () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockRefresh.mockReset()
    mockFetch.mockReset()
  })

  it.each([
    { selectedUser: mockUsers[0], expectedRoute: "/admin/tasks" },
    { selectedUser: mockUsers[1], expectedRoute: "/worker" },
  ])(
    "selects $selectedUser.name and routes to the role-specific page on Sign In",
    async ({ selectedUser, expectedRoute }) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: expectedRoute }),
      })

      const user = userEvent.setup()

      render(<LoginPage />)

      await user.click(screen.getByRole("button", { name: selectedUser.name }))
      await user.click(screen.getByRole("button", { name: /sign in/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUser.id }),
        })
        expect(mockPush).toHaveBeenCalledWith(expectedRoute)
        expect(mockRefresh).toHaveBeenCalled()
      })
    }
  )

  it("shows error message when login fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid user" }),
    })

    const user = userEvent.setup()

    render(<LoginPage />)

    await user.click(screen.getByRole("button", { name: mockUsers[0].name }))
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText("Invalid user")).toBeInTheDocument()
    })
  })

  it("handles network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    const user = userEvent.setup()

    render(<LoginPage />)

    await user.click(screen.getByRole("button", { name: mockUsers[0].name }))
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
    })
  })
})
