import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import TaskComposerPage from "../page"

const mockCreateTask = vi.fn()
const mockPush = vi.fn()
const mockToast = vi.fn()

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/lib/store", () => ({
  createTask: (...args: unknown[]) => mockCreateTask(...args),
}))

describe("TaskComposerPage", () => {
  beforeEach(() => {
    mockCreateTask.mockReset()
    mockPush.mockReset()
    mockToast.mockReset()
    mockCreateTask.mockResolvedValue({})
  })

  it("submits allowMultipleSubmissions in the createTask payload", async () => {
    render(<TaskComposerPage />)

    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: "Launch announcement post" },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Post our product launch announcement on your LinkedIn profile." },
    })
    // Select platform
    fireEvent.click(screen.getByRole("combobox", { name: /platform/i }))
    fireEvent.click(screen.getByRole("option", { name: /linkedin/i }))
    // Fill post content
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: { value: "Excited to announce the launch of onetaskkk!" },
    })
    fireEvent.click(screen.getByRole("switch", { name: /multiple submissions are not allowed/i }))
    fireEvent.click(screen.getByRole("button", { name: /create task/i }))

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalled(), { timeout: 10000 })

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "social_media_posting",
        allowMultipleSubmissions: true,
        title: "Launch announcement post",
      })
    )
    expect(mockPush).toHaveBeenCalledWith("/admin/tasks")
  })
})
