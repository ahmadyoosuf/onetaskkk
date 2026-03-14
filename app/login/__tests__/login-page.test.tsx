import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ImgHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { User } from "@/lib/types"
import LoginPage from "../page"

const mockPush = vi.fn()
const mockLoginAs = vi.fn<(userId: string) => User | null>()

const mockUsers: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@onetaskkk.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
]

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/auth", () => ({
  MOCK_USERS: mockUsers,
  loginAs: (userId: string) => mockLoginAs(userId),
}))

describe("LoginPage", () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockLoginAs.mockReset()
  })

  it.each([
    { selectedUser: mockUsers[0], expectedRoute: "/admin/tasks" },
    { selectedUser: mockUsers[1], expectedRoute: "/worker" },
  ])(
    "selects %s and routes to the role-specific page on Sign In",
    async ({ selectedUser, expectedRoute }) => {
      mockLoginAs.mockReturnValue(selectedUser)
      const user = userEvent.setup()

      render(<LoginPage />)

      await user.click(screen.getByRole("button", { name: selectedUser.name }))
      await user.click(screen.getByRole("button", { name: /sign in/i }))

      await waitFor(() => {
        expect(mockLoginAs).toHaveBeenCalledWith(selectedUser.id)
        expect(mockPush).toHaveBeenCalledWith(expectedRoute)
      })
    }
  )
})
