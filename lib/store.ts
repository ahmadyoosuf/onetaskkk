import type { Task, Submission, User } from "./types"

// ─── In-Memory Mock Database ────────────────────────────────
// In production, replace with actual database calls

let tasks: Task[] = [
  {
    id: "task-1",
    type: "form_submission",
    title: "Complete Beta Signup Form",
    description: "Sign up for our new product beta program by filling out the registration form.",
    details: {
      targetUrl: "https://example.com/beta-signup",
      formFields: ["Full Name", "Email", "Company"],
    },
    reward: 2.5,
    maxSubmissions: 100,
    currentSubmissions: 47,
    status: "open",
    createdAt: new Date("2026-03-10"),
    deadline: new Date("2026-03-20"),
  },
  {
    id: "task-2", 
    type: "email_sending",
    title: "Send Product Feedback Email",
    description: "Send a feedback email about our product to the support team.",
    details: {
      emailContent: "Share your honest feedback about the product experience...",
      targetEmail: "feedback@example.com",
    },
    reward: 3.0,
    maxSubmissions: 50,
    currentSubmissions: 12,
    status: "open",
    createdAt: new Date("2026-03-12"),
  },
  {
    id: "task-3",
    type: "social_media_liking",
    title: "Like Product Launch Post",
    description: "Like our product launch announcement on LinkedIn.",
    details: {
      postUrl: "https://linkedin.com/posts/example-123",
      platform: "linkedin",
    },
    reward: 0.5,
    maxSubmissions: 500,
    currentSubmissions: 234,
    status: "open",
    createdAt: new Date("2026-03-13"),
  },
  {
    id: "task-4",
    type: "form_submission",
    title: "Survey Completion",
    description: "Complete our customer satisfaction survey.",
    details: {
      targetUrl: "https://survey.example.com/satisfaction",
      formFields: ["Rating", "Comments", "Would Recommend"],
    },
    reward: 1.5,
    maxSubmissions: 200,
    currentSubmissions: 200,
    status: "completed",
    createdAt: new Date("2026-03-08"),
  },
]

let submissions: Submission[] = [
  {
    id: "sub-1",
    taskId: "task-1",
    userId: "user-1",
    userName: "Alice Johnson",
    status: "pending",
    proof: "Screenshot of completed form",
    liveAppUrl: "https://example.com/proof/123",
    submittedAt: new Date("2026-03-14T10:30:00"),
  },
  {
    id: "sub-2",
    taskId: "task-1",
    userId: "user-2",
    userName: "Bob Smith",
    status: "approved",
    proof: "Form confirmation email received",
    submittedAt: new Date("2026-03-13T15:20:00"),
    reviewedAt: new Date("2026-03-13T16:00:00"),
  },
  {
    id: "sub-3",
    taskId: "task-2",
    userId: "user-3",
    userName: "Carol Davis",
    status: "pending",
    proof: "Email sent confirmation screenshot",
    submittedAt: new Date("2026-03-14T09:15:00"),
  },
  {
    id: "sub-4",
    taskId: "task-3",
    userId: "user-1",
    userName: "Alice Johnson",
    status: "rejected",
    proof: "Like screenshot",
    submittedAt: new Date("2026-03-13T11:00:00"),
    reviewedAt: new Date("2026-03-13T12:30:00"),
    adminNotes: "Screenshot doesn't show the correct post",
  },
]

const users: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@yoke.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", role: "worker" },
  { id: "user-3", name: "Carol Davis", email: "carol@example.com", role: "worker" },
]

// ─── Task Operations ────────────────────────────────────────
export function getTasks(): Task[] {
  return [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getTask(id: string): Task | undefined {
  return tasks.find((t) => t.id === id)
}

export function createTask(task: Omit<Task, "id" | "createdAt" | "currentSubmissions" | "status">): Task {
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
    currentSubmissions: 0,
    status: "open",
  }
  tasks = [newTask, ...tasks]
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return undefined
  tasks[index] = { ...tasks[index], ...updates }
  return tasks[index]
}

export function deleteTask(id: string): boolean {
  const initialLength = tasks.length
  tasks = tasks.filter((t) => t.id !== id)
  return tasks.length < initialLength
}

// ─── Submission Operations ──────────────────────────────────
export function getSubmissions(taskId?: string): Submission[] {
  const filtered = taskId ? submissions.filter((s) => s.taskId === taskId) : submissions
  return [...filtered].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
}

export function getSubmission(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id)
}

export function createSubmission(submission: Omit<Submission, "id" | "submittedAt" | "status">): Submission {
  const newSubmission: Submission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt: new Date(),
    status: "pending",
  }
  submissions = [newSubmission, ...submissions]
  
  // Increment task submission count
  const task = tasks.find((t) => t.id === submission.taskId)
  if (task) {
    task.currentSubmissions++
    if (task.currentSubmissions >= task.maxSubmissions) {
      task.status = "completed"
    }
  }
  
  return newSubmission
}

export function updateSubmissionStatus(
  id: string, 
  status: "approved" | "rejected",
  adminNotes?: string
): Submission | undefined {
  const index = submissions.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  submissions[index] = {
    ...submissions[index],
    status,
    reviewedAt: new Date(),
    adminNotes,
  }
  return submissions[index]
}

// ─── User Operations ────────────────────────────────────────
export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getCurrentUser(): User {
  // Mock: return worker user by default, admin for /admin routes
  return users[1] // Alice Johnson (worker)
}

export function getAdminUser(): User {
  return users[0]
}
