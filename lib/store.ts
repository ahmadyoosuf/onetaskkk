import type { Task, Submission, User, TaskType, Platform } from "./types"

// ─── Simulated Network Delays (per PRD) ─────────────────────
const FETCH_DELAY = 2000 // 2 seconds for data fetching
const MUTATION_DELAY_MIN = 1000 // 1-3 seconds for mutations
const MUTATION_DELAY_MAX = 3000

function randomMutationDelay(): number {
  return MUTATION_DELAY_MIN + Math.random() * (MUTATION_DELAY_MAX - MUTATION_DELAY_MIN)
}

async function simulateFetchDelay<T>(data: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY))
  return data
}

async function simulateMutationDelay<T>(data: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, randomMutationDelay()))
  return data
}

// ─── Simple Pub/Sub for Reactivity ──────────────────────────
type Listener = () => void
const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  tasksSnapshot = [...tasks]
  submissionsSnapshot = [...submissions]
  listeners.forEach((listener) => listener())
}

// Cached snapshots for useSyncExternalStore (must be referentially stable)
let tasksSnapshot: Task[] = []
let submissionsSnapshot: Submission[] = []

export function getTasksSnapshot(): Task[] {
  return tasksSnapshot
}

export function getSubmissionsSnapshot(): Submission[] {
  return submissionsSnapshot
}

// ─── SWR-compatible Async Fetchers ──────────────────────────
export async function fetchTasks(): Promise<Task[]> {
  const data = [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return simulateFetchDelay(data)
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const data = [...submissions].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  return simulateFetchDelay(data)
}

// ─── Mock Data Generation ───────────────────────────────────
const TASK_TEMPLATES = {
  form_submission: [
    { title: "Complete Beta Signup Form", description: "Sign up for our new product beta program by filling out the registration form.", targetUrl: "https://acme.com/beta-signup", formFields: ["Full Name", "Email", "Company"] },
    { title: "Survey Completion", description: "Complete our customer satisfaction survey to help us improve.", targetUrl: "https://survey.acme.com", formFields: ["Rating", "Comments", "Would Recommend"] },
    { title: "Newsletter Subscription", description: "Subscribe to our newsletter with your email address.", targetUrl: "https://acme.com/newsletter", formFields: ["Email", "Name", "Interests"] },
    { title: "Event Registration", description: "Register for our upcoming virtual event.", targetUrl: "https://events.acme.com/register", formFields: ["Name", "Email", "Timezone"] },
    { title: "Product Demo Request", description: "Fill out the form to request a personalized product demo.", targetUrl: "https://acme.com/demo", formFields: ["Company", "Email", "Use Case"] },
  ],
  email_sending: [
    { title: "Send Product Feedback Email", description: "Send a detailed feedback email about your experience using our product.", emailContent: "Share your honest feedback...", targetEmail: "feedback@acme.com" },
    { title: "Referral Email Campaign", description: "Send an email to a friend about our service with your referral link.", emailContent: "Invite a friend and tell them why you love our product...", targetEmail: "friends@personal.com" },
    { title: "Support Thank You Email", description: "Send a thank you email to our support team for their help.", emailContent: "Thank you for your excellent support...", targetEmail: "support@acme.com" },
    { title: "Feature Request Submission", description: "Email our product team with your feature suggestions.", emailContent: "I would love to see the following features...", targetEmail: "features@acme.com" },
  ],
  social_media_liking: [
    { title: "Like Product Launch Post", description: "Like our product launch announcement on LinkedIn.", postUrl: "https://linkedin.com/posts/acme", platform: "linkedin" as Platform },
    { title: "Twitter Engagement Campaign", description: "Like and retweet our latest product announcement tweet.", postUrl: "https://twitter.com/acme/status", platform: "twitter" as Platform },
    { title: "Instagram Post Engagement", description: "Like our latest Instagram post to boost visibility.", postUrl: "https://instagram.com/p/acme", platform: "instagram" as Platform },
    { title: "Facebook Page Interaction", description: "Like and share our Facebook page announcement.", postUrl: "https://facebook.com/acme/posts", platform: "facebook" as Platform },
  ],
}

function generateMockTasks(): Task[] {
  const now = new Date()
  const tasks: Task[] = []
  const types: TaskType[] = ["form_submission", "email_sending", "social_media_liking"]
  
  // Generate 100+ tasks for virtualizer stress testing
  for (let i = 0; i < 120; i++) {
    const type = types[i % 3]
    const templates = TASK_TEMPLATES[type]
    const template = templates[i % templates.length]
    const daysAgo = Math.floor(i / 3)
    const isCompleted = Math.random() < 0.15
    const isCancelled = !isCompleted && Math.random() < 0.05
    const maxSubs = [50, 100, 200, 300, 500][Math.floor(Math.random() * 5)]
    const currentSubs = isCompleted ? maxSubs : Math.floor(Math.random() * maxSubs * 0.8)
    
    const baseTask = {
      id: `task-${i + 1}`,
      type,
      title: `${template.title}${i > 0 ? ` #${i + 1}` : ""}`,
      description: template.description,
      reward: parseFloat((0.5 + Math.random() * 9.5).toFixed(2)),
      maxSubmissions: maxSubs,
      currentSubmissions: currentSubs,
      status: isCompleted ? "completed" : isCancelled ? "cancelled" : "open",
      createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      deadline: Math.random() > 0.6 ? new Date(now.getTime() + (Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
    }
    
    if (type === "form_submission") {
      const t = template as typeof TASK_TEMPLATES.form_submission[0]
      tasks.push({ ...baseTask, details: { targetUrl: t.targetUrl, formFields: t.formFields } } as Task)
    } else if (type === "email_sending") {
      const t = template as typeof TASK_TEMPLATES.email_sending[0]
      tasks.push({ ...baseTask, details: { emailContent: t.emailContent, targetEmail: t.targetEmail } } as Task)
    } else {
      const t = template as typeof TASK_TEMPLATES.social_media_liking[0]
      tasks.push({ ...baseTask, details: { postUrl: t.postUrl, platform: t.platform } } as Task)
    }
  }
  
  return tasks
}

function generateMockSubmissions(): Submission[] {
  const names = [
    "Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown",
    "Frank Miller", "Grace Lee", "Henry Chen", "Ivy Wang", "Jack Taylor",
    "Kate Martinez", "Liam Anderson", "Mia Thomas", "Noah Garcia", "Olivia Moore",
  ]
  
  const submissions: Submission[] = []
  const now = new Date()
  
  // Generate submissions spread across the 120 tasks
  const statuses: Array<"pending" | "approved" | "rejected"> = ["pending", "approved", "rejected"]
  
  for (let i = 0; i < 300; i++) {
    // Spread submissions across first 60 tasks for realistic distribution
    const taskId = `task-${(i % 60) + 1}`
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

// Initialize snapshots
tasksSnapshot = [...tasks]
submissionsSnapshot = [...submissions]

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

type CreateTaskInputBase = {
  title: string
  description: string
  reward: number
  maxSubmissions: number
  deadline?: Date
}

type CreateTaskInput = 
  | (CreateTaskInputBase & { type: "form_submission"; details: { targetUrl: string; formFields: string[] } })
  | (CreateTaskInputBase & { type: "email_sending"; details: { emailContent: string; targetEmail: string } })
  | (CreateTaskInputBase & { type: "social_media_liking"; details: { postUrl: string; platform: Platform } })

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const newTask: Task = {
    id: `task-${Date.now()}`,
    title: input.title,
    description: input.description,
    reward: input.reward,
    maxSubmissions: input.maxSubmissions,
    currentSubmissions: 0,
    status: "open",
    createdAt: new Date(),
    deadline: input.deadline,
    type: input.type,
    details: input.details,
  } as Task
  
  await simulateMutationDelay(null)
  tasks = [newTask, ...tasks]
  notify()
  return newTask
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return undefined
  await simulateMutationDelay(null)
  tasks[index] = { ...tasks[index], ...updates } as Task
  notify()
  return tasks[index]
}

export async function updateTaskStatus(id: string, status: "open" | "completed" | "cancelled"): Promise<Task | undefined> {
  return updateTask(id, { status })
}

export async function deleteTask(id: string): Promise<boolean> {
  const initialLength = tasks.length
  await simulateMutationDelay(null)
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

export async function createSubmission(submission: Omit<Submission, "id" | "submittedAt" | "status">): Promise<Submission> {
  const newSubmission: Submission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt: new Date(),
    status: "pending",
  }
  
  await simulateMutationDelay(null)
  submissions = [newSubmission, ...submissions]
  
  // Increment task submission count (immutable update)
  const taskIndex = tasks.findIndex((t) => t.id === submission.taskId)
  if (taskIndex !== -1) {
    const task = tasks[taskIndex]
    const newCount = task.currentSubmissions + 1
    const newStatus = newCount >= task.maxSubmissions ? "completed" : task.status
    tasks[taskIndex] = { ...task, currentSubmissions: newCount, status: newStatus }
  }
  
  notify()
  return newSubmission
}

export async function updateSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
  adminNotes?: string
): Promise<Submission | undefined> {
  const index = submissions.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  await simulateMutationDelay(null)
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
