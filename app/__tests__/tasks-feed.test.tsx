import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Task, Submission } from "@/lib/types"
import TasksFeedPage from "../worker/page"

const mockUseTasks = vi.fn()
const mockUseSubmissions = vi.fn()
const mockUseCreateSubmission = vi.fn()

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/hooks/use-store", () => ({
  useTasks: () => mockUseTasks(),
  useSubmissions: () => mockUseSubmissions(),
  useCreateSubmission: () => mockUseCreateSubmission(),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/store", () => ({
  getCurrentUser: () => ({ id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" }),
}))

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * 100,
      })),
    measureElement: () => {},
  }),
}))

describe("TasksFeedPage", () => {
  beforeEach(() => {
    mockUseCreateSubmission.mockReset()
    mockUseTasks.mockReset()
    mockUseSubmissions.mockReset()
    mockUseCreateSubmission.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  })

  it("locks submitting when a worker already submitted a single-submit task", async () => {
    const task: Task = {
      id: "task-1",
      type: "social_media_posting",
      title: "Post product launch announcement",
      description: "Share our product launch on your LinkedIn profile.",
      details: "<p>Share this post and include the product hashtag so we can verify it.</p>",
      reward: 5,
      maxSubmissions: 10,
      allowMultipleSubmissions: false,
      currentSubmissions: 2,
      status: "open",
      createdAt: new Date("2026-03-10T10:00:00Z"),
      taskDetails: {
        platform: "linkedin",
        postContent: "Excited to announce the launch of onetaskkk!",
      },
    }

    const submission: Submission = {
      id: "sub-1",
      taskId: "task-1",
      taskType: "social_media_posting",
      userId: "user-1",
      userName: "Alice Johnson",
      status: "pending",
      postUrl: "https://linkedin.com/posts/alice-launch-post",
      screenshotUrl: "https://cdn.example.com/proofs/sub-1.png",
      submittedAt: new Date("2026-03-11T10:00:00Z"),
    }

    mockUseTasks.mockReturnValue({ tasks: [task], isLoading: false, error: undefined })
    mockUseSubmissions.mockReturnValue({ submissions: [submission], isLoading: false, error: undefined })

    const user = userEvent.setup()
    render(<TasksFeedPage />)

    await user.click(screen.getByText("Post product launch announcement"))

    expect(screen.getByText("One submission per worker")).toBeInTheDocument()
    expect(screen.getByText("You have already submitted this task. Additional submissions are disabled.")).toBeInTheDocument()

    for (const button of screen.getAllByRole("button", { name: /submit work/i })) {
      expect(button).toBeDisabled()
    }
  })
})
