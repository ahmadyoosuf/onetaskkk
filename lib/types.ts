// ─── Task Types ─────────────────────────────────────────────
export type TaskType = "form_submission" | "email_sending" | "social_media_liking"
export type TaskStatus = "open" | "completed" | "cancelled"
export type SubmissionStatus = "pending" | "approved" | "rejected"
export type Platform = "linkedin" | "twitter" | "instagram"

// ─── Task Definitions ───────────────────────────────────────
export interface BaseTask {
  id: string
  type: TaskType
  title: string
  description: string
  reward: number
  maxSubmissions: number
  currentSubmissions: number
  status: TaskStatus
  createdAt: Date
  deadline?: Date
}

export interface FormSubmissionTask extends BaseTask {
  type: "form_submission"
  details: {
    targetUrl: string
    formFields: string[]
  }
}

export interface EmailSendingTask extends BaseTask {
  type: "email_sending"
  details: {
    emailContent: string
    targetEmail: string
  }
}

export interface SocialMediaLikingTask extends BaseTask {
  type: "social_media_liking"
  details: {
    postUrl: string
    platform: Platform
  }
}

export type Task = FormSubmissionTask | EmailSendingTask | SocialMediaLikingTask

// ─── Submission ─────────────────────────────────────────────
export interface Submission {
  id: string
  taskId: string
  userId: string
  userName: string
  status: SubmissionStatus
  proof: string
  liveAppUrl?: string
  submittedAt: Date
  reviewedAt?: Date
  adminNotes?: string
}

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "worker"
}

// ─── Task Type Metadata ─────────────────────────────────────
export const TASK_TYPE_META: Record<TaskType, { label: string; description: string }> = {
  form_submission: {
    label: "Form Submission",
    description: "Workers fill out a target form with specified fields",
  },
  email_sending: {
    label: "Email Sending", 
    description: "Workers send emails to a target address with your content",
  },
  social_media_liking: {
    label: "Social Media Liking",
    description: "Workers engage with your social media post",
  },
}

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
]
