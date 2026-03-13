// ─── Task Types ─────────────────────────────────────────────
export type TaskType = "form_submission" | "email_sending" | "social_media_liking"

export type TaskStatus = "open" | "in_progress" | "completed" | "closed"

export type SubmissionStatus = "pending" | "approved" | "rejected"

export interface Task {
  id: string
  type: TaskType
  title: string
  description: string
  details: TaskDetails
  reward: number
  maxSubmissions: number
  currentSubmissions: number
  status: TaskStatus
  createdAt: Date
  deadline?: Date
}

export interface TaskDetails {
  // Form submission
  targetUrl?: string
  formFields?: string[]
  // Email sending
  emailContent?: string
  targetEmail?: string
  // Social media liking
  postUrl?: string
  platform?: "twitter" | "linkedin" | "instagram"
}

export interface Submission {
  id: string
  taskId: string
  userId: string
  userName: string
  status: SubmissionStatus
  proof: string // URL or text proof
  liveAppUrl?: string
  submittedAt: Date
  reviewedAt?: Date
  adminNotes?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "worker"
}

// ─── Task Type Metadata ─────────────────────────────────────
export const TASK_TYPE_META: Record<TaskType, { label: string; icon: string; description: string }> = {
  form_submission: {
    label: "Form Submission",
    icon: "FileText",
    description: "Fill out a form with specified information",
  },
  email_sending: {
    label: "Email Sending", 
    icon: "Mail",
    description: "Send an email to the target address",
  },
  social_media_liking: {
    label: "Social Media Liking",
    icon: "Heart",
    description: "Like/interact with a social media post",
  },
}
