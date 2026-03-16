// ─── Task Types ─────────────────────────────────────────────
export type TaskType = "social_media_posting" | "email_sending" | "social_media_liking"
export type TaskStatus = "open" | "completed" | "cancelled"
export type SubmissionStatus = "pending" | "approved" | "rejected"
export type Platform = "linkedin" | "twitter" | "instagram"

// ─── Task Phases (Phase 2) ───────────────────────────────────
export interface TaskPhase {
  phaseIndex: number            // 1-based index
  phaseName: string             // e.g. "Phase 1 — Launch"
  slots: number                 // Submissions required to complete this phase
  currentSubmissions: number    // Current submissions for this phase
  instructions: string          // Phase-specific instructions (markdown)
  reward: number                // Reward for this phase (can differ per phase)
}

// ─── Drip Feed (Phase 2) ────────────────────────────────────
export type DripFeedState = "active" | "waiting" | "completed"

export interface DripFeedConfig {
  enabled: boolean
  dripAmount: number            // Slots to release per interval
  dripInterval: number          // Interval in hours (e.g. 6 = every 6 hours)
  startedAt: Date               // When drip feed was activated
}

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
  // Phase 2: Task Phases
  phases?: TaskPhase[]
  // Phase 2: Drip Feed
  dripFeed?: DripFeedConfig
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
  // Phase 2: Which phase this submission belongs to (undefined = non-phased task)
  phaseIndex?: number
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

// ─── Phase 2: Helper Utilities ──────────────────────────────
/** Get the active phase for a phased task (first phase that isn't full). Returns undefined for non-phased tasks. */
export function getActivePhase(task: Task): TaskPhase | undefined {
  if (!task.phases || task.phases.length === 0) return undefined
  return task.phases.find((p) => p.currentSubmissions < p.slots) ?? task.phases[task.phases.length - 1]
}

/** Check if a phased task has all phases completed */
export function areAllPhasesComplete(task: Task): boolean {
  if (!task.phases || task.phases.length === 0) return false
  return task.phases.every((p) => p.currentSubmissions >= p.slots)
}

/** Calculate the drip feed state for a task */
export function getDripFeedState(task: Task): { state: DripFeedState; availableSlots: number; nextReleaseIn: number | null; totalReleased: number } {
  const df = task.dripFeed
  if (!df || !df.enabled) {
    // Non-drip task: all slots are available
    const activePhase = getActivePhase(task)
    const totalSlots = activePhase ? activePhase.slots : task.maxSubmissions
    return { state: "completed", availableSlots: totalSlots, nextReleaseIn: null, totalReleased: totalSlots }
  }

  const now = Date.now()
  const startedAt = df.startedAt instanceof Date ? df.startedAt.getTime() : new Date(df.startedAt).getTime()
  const intervalMs = df.dripInterval * 60 * 60 * 1000

  // Determine total slots from active phase or task
  const activePhase = getActivePhase(task)
  const totalSlots = activePhase ? activePhase.slots : task.maxSubmissions
  const currentSubs = activePhase ? activePhase.currentSubmissions : task.currentSubmissions

  // How many intervals have elapsed since drip start
  const elapsedMs = Math.max(0, now - startedAt)
  const intervalsPassed = Math.floor(elapsedMs / intervalMs) + 1 // +1 for the initial batch
  const totalReleased = Math.min(intervalsPassed * df.dripAmount, totalSlots)

  if (totalReleased >= totalSlots) {
    return { state: "completed", availableSlots: totalSlots - currentSubs, nextReleaseIn: null, totalReleased: totalSlots }
  }

  const availableSlots = Math.max(0, totalReleased - currentSubs)
  const nextReleaseMs = (startedAt + intervalsPassed * intervalMs) - now
  const nextReleaseIn = Math.max(0, Math.ceil(nextReleaseMs / 1000)) // seconds

  if (availableSlots > 0) {
    return { state: "active", availableSlots, nextReleaseIn, totalReleased }
  }

  return { state: "waiting", availableSlots: 0, nextReleaseIn, totalReleased }
}
