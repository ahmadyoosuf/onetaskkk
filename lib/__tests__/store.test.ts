import { describe, it, expect, afterEach, vi } from "vitest"
import type * as StoreModule from "../store"

// Fresh store instance per test via module reset + clear localStorage
async function freshStore(): Promise<typeof StoreModule> {
  vi.resetModules()
  localStorage.clear()
  return import("../store")
}

describe("store — task operations", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("createTask adds a task and returns it", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const initial = store.getTasks().length

    const promise = store.createTask({
      type: "social_media_posting",
      title: "My Test Task",
      description: "A description",
      reward: 5,
      maxSubmissions: 100,
      allowMultipleSubmissions: false,
      details: { platform: "linkedin", postContent: "Check out our product launch!" },
    })
    await vi.runAllTimersAsync()
    const task = await promise

    expect(task.title).toBe("My Test Task")
    expect(task.type).toBe("social_media_posting")
    expect(task.status).toBe("open")
    expect(task.allowMultipleSubmissions).toBe(false)
    expect(store.getTasks().length).toBe(initial + 1)
    expect(store.getTasks()[0].id).toBe(task.id)
  })

  it("deleteTask removes the task and returns true", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const target = store.getTasks()[0]
    const initial = store.getTasks().length

    const promise = store.deleteTask(target.id)
    await vi.runAllTimersAsync()
    const deleted = await promise

    expect(deleted).toBe(true)
    expect(store.getTasks().length).toBe(initial - 1)
    expect(store.getTasks().find((t) => t.id === target.id)).toBeUndefined()
  })

  it("deleteTask returns false for a non-existent id", async () => {
    vi.useFakeTimers()
    const store = await freshStore()

    const promise = store.deleteTask("does-not-exist")
    await vi.runAllTimersAsync()

    expect(await promise).toBe(false)
  })

  it("updateTaskStatus changes the status of a task", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const open = store.getTasks().find((t) => t.status === "open")!

    const promise = store.updateTaskStatus(open.id, "cancelled")
    await vi.runAllTimersAsync()
    const updated = await promise

    expect(updated?.status).toBe("cancelled")
    expect(store.getTasks().find((t) => t.id === open.id)?.status).toBe("cancelled")
  })

  it("seeded social tasks only use supported platforms", async () => {
    const store = await freshStore()
    const supportedPlatforms = new Set(["linkedin", "twitter", "instagram"])
    const socialTasks = store.getTasks().filter((task) => task.type === "social_media_liking")

    expect(socialTasks.every((task) => supportedPlatforms.has(task.details.platform))).toBe(true)
  })
})

describe("store — submission operations", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("createSubmission adds a submission and increments task count", async () => {
    vi.useFakeTimers()
    const store = await freshStore()

    const taskPromise = store.createTask({
      type: "social_media_posting",
      title: "Submission Test Task",
      description: "A dedicated task for submission behavior tests.",
      reward: 4,
      maxSubmissions: 25,
      allowMultipleSubmissions: true,
      details: { platform: "twitter", postContent: "Test post content for submission" },
    })
    await vi.runAllTimersAsync()
    const task = await taskPromise
    const before = task.currentSubmissions

    const promise = store.createSubmission({
      taskId: task.id,
      taskType: "social_media_posting",
      userId: "user-1",
      userName: "Test User",
      postUrl: "https://twitter.com/test-user/status/123",
      screenshotUrl: "https://cdn.example.com/proofs/submission-test.png",
    })
    await vi.runAllTimersAsync()
    const submission = await promise

    expect(submission.status).toBe("pending")
    expect(submission.taskId).toBe(task.id)
    const updatedTask = store.getTasks().find((t) => t.id === task.id)!
    expect(updatedTask.currentSubmissions).toBe(before + 1)
  })

  it("blocks repeat submissions when the task disallows them", async () => {
    vi.useFakeTimers()
    const store = await freshStore()

    const taskPromise = store.createTask({
      type: "email_sending",
      title: "Single Attempt Task",
      description: "Only one submission per worker is allowed.",
      reward: 2,
      maxSubmissions: 10,
      allowMultipleSubmissions: false,
      details: { targetEmail: "owner@example.com", emailContent: "Send this exact message." },
    })
    await vi.runAllTimersAsync()
    const task = await taskPromise

    const firstSubmission = store.createSubmission({
      taskId: task.id,
      taskType: "email_sending",
      userId: "user-1",
      userName: "Test User",
      emailContent: "Initial completion details",
      screenshotUrl: "https://cdn.example.com/proofs/first-email.png",
    })
    await vi.runAllTimersAsync()
    await firstSubmission

    await expect(store.createSubmission({
      taskId: task.id,
      taskType: "email_sending",
      userId: "user-1",
      userName: "Test User",
      emailContent: "Trying to submit again",
      screenshotUrl: "https://cdn.example.com/proofs/second-email.png",
    })).rejects.toThrow("already submitted")
  })

  it("updateSubmissionStatus approves with notes and sets reviewedAt", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const pending = store.getSubmissions().find((s) => s.status === "pending")!

    const promise = store.updateSubmissionStatus(pending.id, "approved", "Great work!")
    await vi.runAllTimersAsync()
    const updated = await promise

    expect(updated?.status).toBe("approved")
    expect(updated?.adminNotes).toBe("Great work!")
    expect(updated?.reviewedAt).toBeInstanceOf(Date)
  })

  it("updateSubmissionStatus rejects with a reason", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const pending = store.getSubmissions().find((s) => s.status === "pending")!

    const promise = store.updateSubmissionStatus(pending.id, "rejected", "Proof insufficient")
    await vi.runAllTimersAsync()
    const updated = await promise

    expect(updated?.status).toBe("rejected")
    expect(updated?.adminNotes).toBe("Proof insufficient")
  })
})

describe("store — localStorage persistence", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("created task survives a simulated page reload", async () => {
    vi.useFakeTimers()
    const store = await freshStore()

    const promise = store.createTask({
      type: "email_sending",
      title: "Persisted Task",
      description: "Survives reload",
      reward: 3,
      maxSubmissions: 50,
      allowMultipleSubmissions: true,
      details: { targetEmail: "test@example.com", emailContent: "Hello!" },
    })
    await vi.runAllTimersAsync()
    await promise
    vi.useRealTimers()

    // Simulate reload — re-import without clearing localStorage
    vi.resetModules()
    const reloaded = await import("../store")
    expect(reloaded.getTasks().find((t) => t.title === "Persisted Task")).toBeDefined()
  })

  it("deleted task is gone after simulated page reload", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const target = store.getTasks()[0]

    const promise = store.deleteTask(target.id)
    await vi.runAllTimersAsync()
    await promise
    vi.useRealTimers()

    vi.resetModules()
    const reloaded = await import("../store")
    expect(reloaded.getTasks().find((t) => t.id === target.id)).toBeUndefined()
  })
})
