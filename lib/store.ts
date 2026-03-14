import type { Task, Submission, User, TaskType, Platform } from "./types"

// ─── Simple Pub/Sub for Reactivity ──────────────────────────
type Listener = () => void
const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach((listener) => listener())
}

// ─── Mock Data Generation ───────────────────────────────────
function generateMockTasks(): Task[] {
  const now = new Date()
  
  return [
    {
      id: "task-1",
      type: "form_submission",
      title: "Complete Beta Signup Form",
      description: "Sign up for our new product beta program by filling out the registration form with your details.",
      details: { targetUrl: "https://acme.com/beta-signup", formFields: ["Full Name", "Email", "Company"] },
      reward: 2.5,
      maxSubmissions: 100,
      currentSubmissions: 47,
      status: "open",
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: "task-2",
      type: "email_sending",
      title: "Send Product Feedback Email",
      description: "Send a detailed feedback email about your experience using our product to the support team.",
      details: { emailContent: "Share your honest feedback about the product experience...", targetEmail: "feedback@acme.com" },
      reward: 3.0,
      maxSubmissions: 50,
      currentSubmissions: 12,
      status: "open",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "task-3",
      type: "social_media_liking",
      title: "Like Product Launch Post",
      description: "Like our product launch announcement on LinkedIn to help boost visibility.",
      details: { postUrl: "https://linkedin.com/posts/acme-123", platform: "linkedin" as Platform },
      reward: 0.5,
      maxSubmissions: 500,
      currentSubmissions: 234,
      status: "open",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: "task-4",
      type: "form_submission",
      title: "Survey Completion",
      description: "Complete our customer satisfaction survey to help us improve our services.",
      details: { targetUrl: "https://survey.acme.com/satisfaction", formFields: ["Rating", "Comments", "Would Recommend"] },
      reward: 1.5,
      maxSubmissions: 200,
      currentSubmissions: 200,
      status: "completed",
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: "task-5",
      type: "social_media_liking",
      title: "Twitter Engagement Campaign",
      description: "Like and retweet our latest product announcement tweet.",
      details: { postUrl: "https://twitter.com/acme/status/123456", platform: "twitter" as Platform },
      reward: 0.75,
      maxSubmissions: 300,
      currentSubmissions: 89,
      status: "open",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "task-6",
      type: "email_sending",
      title: "Referral Email Campaign",
      description: "Send an email to a friend telling them about our service and include your referral link.",
      details: { emailContent: "Invite a friend and tell them why you love our product...", targetEmail: "friends@personal.com" },
      reward: 5.0,
      maxSubmissions: 100,
      currentSubmissions: 23,
      status: "open",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
  ] as Task[]
}

function generateMockSubmissions(): Submission[] {
  const names = [
    "Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown",
    "Frank Miller", "Grace Lee", "Henry Chen", "Ivy Wang", "Jack Taylor",
    "Kate Martinez", "Liam Anderson", "Mia Thomas", "Noah Garcia", "Olivia Moore",
  ]
  
  const submissions: Submission[] = []
  const now = new Date()
  
  // Generate 100+ submissions across tasks
  const taskIds = ["task-1", "task-2", "task-3", "task-5", "task-6"]
  const statuses: Array<"pending" | "approved" | "rejected"> = ["pending", "approved", "rejected"]
  
  for (let i = 0; i < 120; i++) {
    const taskId = taskIds[i % taskIds.length]
    const status = statuses[Math.floor(Math.random() * 3)]
    const daysAgo = Math.floor(Math.random() * 30)
    const submittedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const userName = names[i % names.length]
    
    submissions.push({
      id: `sub-${i + 1}`,
      taskId,
      userId: `user-${(i % 15) + 1}`,
      userName,
      status,
      proof: status === "rejected" 
        ? "Screenshot provided but task not completed correctly"
        : "Screenshot showing completed task submission",
      liveAppUrl: Math.random() > 0.5 ? `https://proof.example.com/${i}` : undefined,
      submittedAt,
      reviewedAt: status !== "pending" ? new Date(submittedAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
      adminNotes: status === "rejected" ? "Submission does not meet requirements" : undefined,
    })
  }
  
  return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
}

// ─── In-Memory Store ────────────────────────────────────────
let tasks: Task[] = generateMockTasks()
let submissions: Submission[] = generateMockSubmissions()

const users: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@yoke.app", role: "admin" },
  { id: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "worker" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", role: "worker" },
]

// ─── Task Operations ────────────────────────────────────────
export function getTasks(): Task[] {
  return [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getTask(id: string): Task | undefined {
  return tasks.find((t) => t.id === id)
}

type CreateTaskInput = {
  type: TaskType
  title: string
  description: string
  reward: number
  maxSubmissions: number
  deadline?: Date
  details: Task["details"]
}

export function createTask(input: CreateTaskInput): Task {
  const newTask = {
    ...input,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
    currentSubmissions: 0,
    status: "open" as const,
  } as Task
  
  tasks = [newTask, ...tasks]
  notify()
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return undefined
  tasks[index] = { ...tasks[index], ...updates } as Task
  notify()
  return tasks[index]
}

export function updateTaskStatus(id: string, status: "open" | "completed" | "cancelled"): Task | undefined {
  return updateTask(id, { status })
}

export function deleteTask(id: string): boolean {
  const initialLength = tasks.length
  tasks = tasks.filter((t) => t.id !== id)
  const deleted = tasks.length < initialLength
  if (deleted) notify()
  return deleted
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
  
  notify()
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
  notify()
  return submissions[index]
}

// ─── User Operations ────────────────────────────────────────
export function getCurrentUser(): User {
  return users[1]
}

export function getAdminUser(): User {
  return users[0]
}
