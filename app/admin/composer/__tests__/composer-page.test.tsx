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
      target: { value: "Launch feedback form" },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Collect thoughtful launch feedback from new users in a single form." },
    })
    fireEvent.change(screen.getByLabelText(/target url/i), {
      target: { value: "https://example.com/launch-feedback" },
    })
    fireEvent.change(screen.getByLabelText(/form fields/i), {
      target: { value: "Name, Email, Feedback" },
    })
    fireEvent.click(screen.getByRole("switch", { name: /multiple submissions are not allowed/i }))
    fireEvent.click(screen.getByRole("button", { name: /create task/i }))

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalled(), { timeout: 10000 })

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "form_submission",
        allowMultipleSubmissions: true,
        title: "Launch feedback form",
      })
    )
    expect(mockPush).toHaveBeenCalledWith("/admin/tasks")
  })
})
