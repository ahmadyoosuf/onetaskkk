import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
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
      type: "form_submission",
      title: "My Test Task",
      description: "A description",
      reward: 5,
      maxSubmissions: 100,
      details: { targetUrl: "https://example.com", formFields: ["Name", "Email"] },
    })
    await vi.runAllTimersAsync()
    const task = await promise

    expect(task.title).toBe("My Test Task")
    expect(task.type).toBe("form_submission")
    expect(task.status).toBe("open")
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
})

describe("store — submission operations", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("createSubmission adds a submission and increments task count", async () => {
    vi.useFakeTimers()
    const store = await freshStore()
    const task = store.getTasks().find((t) => t.status === "open")!
    const before = task.currentSubmissions

    const promise = store.createSubmission({
      taskId: task.id,
      userId: "user-1",
      userName: "Test User",
      proof: "I completed the form",
    })
    await vi.runAllTimersAsync()
    const submission = await promise

    expect(submission.status).toBe("pending")
    expect(submission.taskId).toBe(task.id)
    const updatedTask = store.getTasks().find((t) => t.id === task.id)!
    expect(updatedTask.currentSubmissions).toBe(before + 1)
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
