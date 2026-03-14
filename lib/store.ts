import type { Task, Submission, User, TaskType, Platform } from "./types"

// ─── LocalStorage Persistence ────────────────────────────────
const STORAGE_KEYS = {
  tasks: "taskmarket_tasks",
  submissions: "taskmarket_submissions",
} as const

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value)
  }
  return value
}

function loadFromStorage<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw, reviveDates) as T[]
  } catch {
    return null
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore storage errors (e.g. private browsing, quota exceeded)
  }
}

function withTaskDefaults(task: Task): Task {
  return {
    ...task,
    allowMultipleSubmissions: task.allowMultipleSubmissions ?? true,
  }
}

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
  saveToStorage(STORAGE_KEYS.tasks, tasks)
  saveToStorage(STORAGE_KEYS.submissions, submissions)
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
  social_media_posting: [
    { title: "Announce Our Product Launch", description: "Post our product launch announcement on your LinkedIn profile to reach your professional network.", platform: "linkedin" as Platform, postContent: "Excited to announce the launch of onetaskkk — the fastest way to get micro-tasks done! Check it out at taskmarket.io #ProductLaunch #SaaS", accountHandle: "" },
    { title: "Tweet About Our New Feature", description: "Share our new feature release tweet on your Twitter/X account.", platform: "twitter" as Platform, postContent: "Just discovered @onetaskkk's new AI-powered task matching. This is a game-changer for freelancers! 🚀 #freelance #productivity", accountHandle: "" },
    { title: "LinkedIn Thought Leadership Post", description: "Post a thought leadership piece on LinkedIn tagging our brand.", platform: "linkedin" as Platform, postContent: "The future of work is micro-tasks. Here's why platforms like onetaskkk are reshaping the gig economy... [thread]", accountHandle: "" },
    { title: "Instagram Story Mention", description: "Post an Instagram story mentioning our brand and linking to our profile.", platform: "instagram" as Platform, postContent: "Using @taskmarket_app to earn money completing quick tasks from my phone! So easy 💸", accountHandle: "" },
    { title: "Share Our Case Study on LinkedIn", description: "Share our latest customer case study post on your LinkedIn feed.", platform: "linkedin" as Platform, postContent: "How a small team used onetaskkk to complete 10,000 micro-tasks in under a week. Full case study linked below. #CaseStudy #GrowthHacking", accountHandle: "" },
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
    { title: "Instagram Story Engagement", description: "Like our latest Instagram story highlight to boost visibility.", postUrl: "https://instagram.com/stories/highlights/acme", platform: "instagram" as Platform },
  ],
}

function generateMockTasks(): Task[] {
  const now = new Date()
  const tasks: Task[] = []
  const types: TaskType[] = ["social_media_posting", "email_sending", "social_media_liking"]
  
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
    
    // Assign tasks to campaigns for bulk operations
    const campaigns = ["spring-launch", "q2-marketing", "social-boost", "engagement-2026", undefined]
    const campaignId = campaigns[i % campaigns.length]
    
    const baseTask = {
      id: `task-${i + 1}`,
      type,
      title: `${template.title}${i > 0 ? ` #${i + 1}` : ""}`,
      description: template.description,
      reward: parseFloat((0.5 + Math.random() * 9.5).toFixed(2)),
      maxSubmissions: maxSubs,
      allowMultipleSubmissions: i % 4 !== 0,
      currentSubmissions: currentSubs,
      status: isCompleted ? "completed" : isCancelled ? "cancelled" : "open",
      createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      deadline: Math.random() > 0.6 ? new Date(now.getTime() + (Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
      campaignId,
    }
    
    if (type === "social_media_posting") {
      const t = template as typeof TASK_TEMPLATES.social_media_posting[0]
      tasks.push({ ...baseTask, details: { platform: t.platform, postContent: t.postContent, accountHandle: t.accountHandle } } as Task)
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

function generateMockSubmissions(generatedTasks: Task[]): Submission[] {
  const names = [
    "Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown",
    "Frank Miller", "Grace Lee", "Henry Chen", "Ivy Wang", "Jack Taylor",
    "Kate Martinez", "Liam Anderson", "Mia Thomas", "Noah Garcia", "Olivia Moore",
  ]
  
  const submissions: Submission[] = []
  const now = new Date()
  
  // Generate submissions spread across the tasks
  const statuses: Array<"pending" | "approved" | "rejected"> = ["pending", "approved", "rejected"]
  
  for (let i = 0; i < 300; i++) {
    // Spread submissions across first 60 tasks for realistic distribution
    const taskIndex = i % Math.min(60, generatedTasks.length)
    const task = generatedTasks[taskIndex]
    const taskId = task.id
    const taskType = task.type
    const status = statuses[Math.floor(Math.random() * 3)]
    const daysAgo = Math.floor(Math.random() * 30)
    const submittedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const userName = names[i % names.length]
    
    // PRD-compliant submission fields based on task type
    const submission: Submission = {
      id: `sub-${i + 1}`,
      taskId,
      taskType,
      userId: `user-${(i % 15) + 1}`,
      userName,
      status,
      screenshotUrl: `https://screenshots.example.com/evidence-${i + 1}.png`,
      submittedAt,
      reviewedAt: status !== "pending" ? new Date(submittedAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
      adminNotes: status === "rejected" ? "Submission does not meet requirements" : undefined,
    }
    
    // Add task-type-specific fields per PRD
    if (taskType === "social_media_posting" || taskType === "social_media_liking") {
      submission.postUrl = `https://linkedin.com/posts/user-${i}-post-${taskIndex}`
    } else if (taskType === "email_sending") {
      submission.emailContent = `Dear Team,\n\nI am writing to share my experience with your product. The onboarding was seamless and the features are exactly what I needed.\n\nBest regards,\n${userName}`
    }
    
    submissions.push(submission)
  }
  
  return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
}

// ─── In-Memory Store ────────────────────────────────────────
const storedTasks = loadFromStorage<Task>(STORAGE_KEYS.tasks)
const generatedTasks = storedTasks ?? generateMockTasks()
let tasks: Task[] = generatedTasks.map(withTaskDefaults)
let submissions: Submission[] = loadFromStorage<Submission>(STORAGE_KEYS.submissions) ?? generateMockSubmissions(tasks)

// Initialize snapshots
tasksSnapshot = [...tasks]
submissionsSnapshot = [...submissions]

// Persist initial data to localStorage (seeds first-time visitors)
saveToStorage(STORAGE_KEYS.tasks, tasks)
saveToStorage(STORAGE_KEYS.submissions, submissions)

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
  allowMultipleSubmissions: boolean
  deadline?: Date
  campaignId?: string
}

type CreateTaskInput = 
  | (CreateTaskInputBase & { type: "social_media_posting"; details: { platform: Platform; postContent: string; accountHandle?: string } })
  | (CreateTaskInputBase & { type: "email_sending"; details: { emailContent: string; targetEmail: string } })
  | (CreateTaskInputBase & { type: "social_media_liking"; details: { postUrl: string; platform: Platform } })

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const newTask: Task = {
    id: `task-${Date.now()}`,
    title: input.title,
    description: input.description,
    reward: input.reward,
    maxSubmissions: input.maxSubmissions,
    allowMultipleSubmissions: input.allowMultipleSubmissions,
    currentSubmissions: 0,
    status: "open",
    createdAt: new Date(),
    deadline: input.deadline,
    campaignId: input.campaignId,
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
  const taskIndex = tasks.findIndex((t) => t.id === submission.taskId)
  if (taskIndex === -1) {
    throw new Error("Task not found")
  }

  const task = tasks[taskIndex]
  if (task.status !== "open" || task.currentSubmissions >= task.maxSubmissions) {
    throw new Error("Task is no longer accepting submissions")
  }

  if (!task.allowMultipleSubmissions) {
    const alreadySubmitted = submissions.some(
      (existing) => existing.taskId === submission.taskId && existing.userId === submission.userId
    )
    if (alreadySubmitted) {
      throw new Error("You have already submitted this task")
    }
  }

  const newSubmission: Submission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt: new Date(),
    status: "pending",
  }
  
  await simulateMutationDelay(null)
  submissions = [newSubmission, ...submissions]
  
  // Increment task submission count (immutable update)
  const newCount = task.currentSubmissions + 1
  const newStatus = newCount >= task.maxSubmissions ? "completed" : task.status
  tasks[taskIndex] = { ...task, currentSubmissions: newCount, status: newStatus }
  
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
