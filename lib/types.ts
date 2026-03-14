// ─── Task Types ─────────────────────────────────────────────
export type TaskType = "social_media_posting" | "email_sending" | "social_media_liking"
export type TaskStatus = "open" | "completed" | "cancelled"
export type SubmissionStatus = "pending" | "approved" | "rejected"
export type Platform = "linkedin" | "twitter" | "instagram"

// ─── Task Definitions ───────────────────────────────────────
export interface BaseTask {
  id: string
  type: TaskType
  title: string
  description?: string
  details: string
  reward: number
  maxSubmissions: number
  allowMultipleSubmissions: boolean
  currentSubmissions: number
  status: TaskStatus
  createdAt: Date
  deadline?: Date
  campaignId?: string // For bulk operations and grouping
}

export interface SocialMediaPostingTask extends BaseTask {
  type: "social_media_posting"
  taskDetails: {
    platform: Platform
    postContent: string
    accountHandle?: string
  }
}

export interface EmailSendingTask extends BaseTask {
  type: "email_sending"
  taskDetails: {
    emailContent: string
    targetEmail: string
  }
}

export interface SocialMediaLikingTask extends BaseTask {
  type: "social_media_liking"
  taskDetails: {
    postUrl: string
    platform: Platform
  }
}

export type Task = SocialMediaPostingTask | EmailSendingTask | SocialMediaLikingTask

// ─── Submission (PRD-compliant fields per task type) ────────
export interface Submission {
  id: string
  taskId: string
  taskType: TaskType // Store task type for field display
  userId: string
  userName: string
  status: SubmissionStatus
  // Task-type-specific fields (per PRD)
  postUrl?: string        // For social_media_posting and social_media_liking
  emailContent?: string   // For email_sending
  screenshotUrl: string   // Required for all task types
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
  social_media_posting: {
    label: "Social Media Posting",
    description: "Workers post your content on their social media accounts",
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
