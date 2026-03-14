import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Submission, Task } from "@/lib/types"
import TasksManagementPage from "../page"

const mockUseTasks = vi.fn()
const mockUseSubmissions = vi.fn()

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock("@/hooks/use-store", () => ({
  useTasks: () => mockUseTasks(),
  useSubmissions: () => mockUseSubmissions(),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/store", () => ({
  deleteTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}))

describe("TasksManagementPage", () => {
  beforeEach(() => {
    mockUseTasks.mockReset()
    mockUseSubmissions.mockReset()
  })

  it("renders submission totals and pending counts from the live submissions hook", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        type: "email_sending",
        title: "Send launch email",
        description: "Send the prepared launch email to the target address.",
        reward: 7,
        maxSubmissions: 20,
        allowMultipleSubmissions: true,
        currentSubmissions: 2,
        status: "open",
        createdAt: new Date("2026-03-10T10:00:00Z"),
        details: {
          targetEmail: "launch@example.com",
          emailContent: "Share the launch details.",
        },
      },
    ]

    const submissions: Submission[] = [
      {
        id: "sub-1",
        taskId: "task-1",
        userId: "user-1",
        userName: "Alice Johnson",
        status: "pending",
        proof: "Shared the launch email with the requested details.",
        submittedAt: new Date("2026-03-11T10:00:00Z"),
      },
      {
        id: "sub-2",
        taskId: "task-1",
        userId: "user-2",
        userName: "Bob Smith",
        status: "approved",
        proof: "Completed and attached evidence.",
        submittedAt: new Date("2026-03-11T11:00:00Z"),
      },
    ]

    mockUseTasks.mockReturnValue({ tasks, isLoading: false, error: undefined })
    mockUseSubmissions.mockReturnValue({ submissions, isLoading: false, error: undefined })

    render(<TasksManagementPage />)

    expect(screen.getByText("Submissions", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByText("2", { selector: "p" })).toBeInTheDocument()
    expect(screen.getAllByText("1 pending").length).toBeGreaterThan(0)
  })
})
