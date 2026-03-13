// ─── Task Types ─────────────────────────────────────────────
export type TaskStatus = "draft" | "open" | "in_progress" | "review" | "completed" | "cancelled"
export type TaskCategory = "development" | "design" | "writing" | "research" | "marketing" | "data"
export type SubmissionStatus = "pending" | "approved" | "rejected"

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  budget: number
  skills: string[]
  deadline: string // ISO date string
  attachments: string[]
  status: TaskStatus
  submissionCount: number
  createdAt: string
  updatedAt: string
}

export interface Submission {
  id: string
  taskId: string
  taskTitle: string
  submitterName: string
  submitterEmail: string
  status: SubmissionStatus
  submittedAt: string
  reviewedAt?: string
  notes?: string
}

// ─── Form Schema Types ──────────────────────────────────────
export interface TaskFormData {
  title: string
  description: string
  category: TaskCategory
  budget: number
  skills: string[]
  deadline: string
  attachments: string[]
}

// ─── Filter/Sort Types ──────────────────────────────────────
export interface TaskFilters {
  status?: TaskStatus[]
  category?: TaskCategory[]
  budgetMin?: number
  budgetMax?: number
  search?: string
}

export interface SubmissionFilters {
  status?: SubmissionStatus[]
  taskId?: string
  search?: string
}

export type SortDirection = "asc" | "desc"

export interface SortConfig<T extends string> {
  field: T
  direction: SortDirection
}

// ─── Constants ──────────────────────────────────────────────
export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing" },
  { value: "research", label: "Research" },
  { value: "marketing", label: "Marketing" },
  { value: "data", label: "Data" },
]

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export const SKILL_OPTIONS = [
  "React", "TypeScript", "Node.js", "Python", "Figma", "UI/UX",
  "Copywriting", "SEO", "Data Analysis", "SQL", "Excel", "Research",
  "Project Management", "Marketing Strategy", "Social Media", "GraphQL",
  "AWS", "Docker", "Tailwind CSS", "Next.js", "Vue.js", "Angular",
]
