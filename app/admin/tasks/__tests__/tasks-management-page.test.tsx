import { render, screen, within } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Submission, Task } from "@/lib/types"
import TasksManagementPage from "../page"

const mockUseTasks = vi.fn()
const mockUseSubmissions = vi.fn()
const mockUseDeleteTask = vi.fn()
const mockUseUpdateTaskStatus = vi.fn()
const mockUseUpdateTask = vi.fn()

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock("@/hooks/use-store", () => ({
  useTasks: () => mockUseTasks(),
  useSubmissions: () => mockUseSubmissions(),
  useDeleteTask: () => mockUseDeleteTask(),
  useUpdateTaskStatus: () => mockUseUpdateTaskStatus(),
  useUpdateTask: () => mockUseUpdateTask(),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe("TasksManagementPage", () => {
  beforeEach(() => {
    mockUseTasks.mockReset()
    mockUseSubmissions.mockReset()
    mockUseDeleteTask.mockReset()
    mockUseUpdateTaskStatus.mockReset()
    mockUseUpdateTask.mockReset()

    mockUseDeleteTask.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    mockUseUpdateTaskStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    mockUseUpdateTask.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  })

  it("renders submission totals and pending counts from the submissions hook", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        type: "email_sending",
        title: "Send launch email",
        description: "Send the prepared launch email to the target address.",
        details: "<p>Use the approved copy and send it to the listed recipient.</p>",
        reward: 7,
        maxSubmissions: 20,
        allowMultipleSubmissions: true,
        currentSubmissions: 2,
        status: "open",
        createdAt: new Date("2026-03-10T10:00:00Z"),
        taskDetails: {
          targetEmail: "launch@example.com",
          emailContent: "Share the launch details.",
        },
      },
    ]

    const submissions: Submission[] = [
      {
        id: "sub-1",
        taskId: "task-1",
        taskType: "email_sending",
        userId: "user-1",
        userName: "Alice Johnson",
        status: "pending",
        emailContent: "Shared the launch email with the requested details.",
        screenshotUrl: "https://cdn.example.com/proofs/sub-1.png",
        submittedAt: new Date("2026-03-11T10:00:00Z"),
      },
      {
        id: "sub-2",
        taskId: "task-1",
        taskType: "email_sending",
        userId: "user-2",
        userName: "Bob Smith",
        status: "approved",
        emailContent: "Completed and attached evidence.",
        screenshotUrl: "https://cdn.example.com/proofs/sub-2.png",
        submittedAt: new Date("2026-03-11T11:00:00Z"),
      },
    ]

    mockUseTasks.mockReturnValue({ tasks, isLoading: false, error: undefined })
    mockUseSubmissions.mockReturnValue({ submissions, isLoading: false, error: undefined })

    render(<TasksManagementPage />)

    const submissionsCard = screen.getByText("Submissions").closest("div")
    expect(submissionsCard).not.toBeNull()
    expect(within(submissionsCard as HTMLElement).getByText("2")).toBeInTheDocument()

    expect(screen.getAllByText("1 pending").length).toBeGreaterThan(0)
  })
})
