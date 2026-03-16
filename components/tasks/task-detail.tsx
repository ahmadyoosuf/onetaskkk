import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TASK_TYPE_META, getActivePhase, getDripFeedState, type Task, type TaskType, type TaskPhase, type Submission } from "@/lib/types"
import { Calendar, Check, DollarSign, ExternalLink, Heart, Layers, Mail, Send, Share2, Timer, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const TASK_ICONS: Record<TaskType, typeof Share2> = {
  social_media_posting: Share2,
  email_sending: Mail,
  social_media_liking: Heart,
}

export function TaskInstructionDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-3 rounded-lg bg-muted/50 p-3 text-sm">
      <Badge variant="outline" className="border-border/30">
        {task.allowMultipleSubmissions ? "Repeat submissions allowed" : "One submission per worker"}
      </Badge>

      {task.type === "social_media_posting" && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Platform</span>
            <Badge variant="outline" className="capitalize text-xs">
              {task.taskDetails.platform}
            </Badge>
          </div>
          {task.taskDetails.accountHandle && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Tag</span>
              <span className="font-mono text-xs">{task.taskDetails.accountHandle}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground text-xs">Post Content:</span>
            <p className="mt-1 rounded border border-border/30 bg-background p-2 text-xs leading-relaxed">
              {task.taskDetails.postContent}
            </p>
          </div>
        </>
      )}

      {task.type === "email_sending" && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Send to</span>
            <span className="font-mono text-xs">{task.taskDetails.targetEmail}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Email Content:</span>
            <p className="mt-1 rounded border border-border/30 bg-background p-2 text-xs">{task.taskDetails.emailContent}</p>
          </div>
        </>
      )}

      {task.type === "social_media_liking" && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Platform</span>
            <Badge variant="outline" className="capitalize text-xs">
              {task.taskDetails.platform}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Post</span>
            <a
              href={task.taskDetails.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline text-xs"
            >
              View Post <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Drip Feed Countdown ────────────────────────────────────
function DripFeedCountdown({ nextReleaseIn }: { nextReleaseIn: number }) {
  const [secondsLeft, setSecondsLeft] = useState(nextReleaseIn)

  useEffect(() => {
    setSecondsLeft(nextReleaseIn)
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [nextReleaseIn])

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const secs = secondsLeft % 60

  return (
    <span className="font-mono text-xs tabular-nums">
      {hours > 0 && `${hours}h `}{String(minutes).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </span>
  )
}

// ─── Phase Progress Card (for workers) ──────────────────────
function PhaseProgressCard({ phase, isActive, isCompleted, hasSubmitted }: {
  phase: TaskPhase
  isActive: boolean
  isCompleted: boolean
  hasSubmitted: boolean
}) {
  const progress = (phase.currentSubmissions / phase.slots) * 100

  return (
    <div className={cn(
      "rounded-lg border p-2.5 transition-colors",
      isActive ? "border-primary/30 bg-primary/5" :
      isCompleted ? "border-success/20 bg-success/5" :
      "border-border/20 bg-muted/30"
    )}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold shrink-0",
            isActive ? "bg-primary text-primary-foreground" :
            isCompleted ? "bg-success text-success-foreground" :
            "bg-muted text-muted-foreground"
          )}>
            {isCompleted ? <Check className="h-3 w-3" /> : phase.phaseIndex}
          </div>
          <span className={cn(
            "text-xs font-medium truncate",
            isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
          )}>
            {phase.phaseName}
          </span>
          {hasSubmitted && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-success/30 text-success shrink-0">
              Submitted
            </Badge>
          )}
        </div>
        <span className="text-xs font-mono text-success shrink-0">A${phase.reward.toFixed(2)}</span>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">
          {phase.currentSubmissions}/{phase.slots} slots
        </span>
        {isActive && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
            Active
          </Badge>
        )}
      </div>
    </div>
  )
}

type TaskDetailProps = {
  task: Task
  isSubmitLocked: boolean
  onSubmit: () => void
  /** Submissions from the current user, used to show past phase participation */
  userSubmissions?: Submission[]
}

export function TaskDetail({ task, isSubmitLocked, onSubmit, userSubmissions = [] }: TaskDetailProps) {
  const Icon = TASK_ICONS[task.type]
  const isPhased = task.phases && task.phases.length > 0
  const activePhase = isPhased ? getActivePhase(task) : undefined
  const dripState = task.dripFeed?.enabled ? getDripFeedState(task) : null

  // Determine which phases the worker has submitted to
  const submittedPhaseIndices = new Set(
    userSubmissions
      .filter((s) => s.taskId === task.id && s.phaseIndex !== undefined)
      .map((s) => s.phaseIndex!)
  )

  // For phased tasks, show the active phase's reward. For standard, show task reward.
  const displayReward = activePhase ? activePhase.reward : task.reward
  const spotsLeft = activePhase
    ? activePhase.slots - activePhase.currentSubmissions
    : task.maxSubmissions - task.currentSubmissions

  // Drip feed can further limit available slots
  const dripAvailableSlots = dripState ? dripState.availableSlots : spotsLeft
  const effectiveSpotsLeft = Math.min(spotsLeft, dripAvailableSlots)

  // Submit is locked if drip feed is in waiting state with 0 available slots
  const isDripLocked = dripState?.state === "waiting" && dripState.availableSlots <= 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base truncate">{task.title}</CardTitle>
          <CardDescription className="text-xs">{TASK_TYPE_META[task.type].label}</CardDescription>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{task.description}</p>

      {/* Phase 2: Active Phase Info */}
      {isPhased && activePhase && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-info" />
            <span className="text-xs font-medium">Current Phase</span>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{activePhase.phaseName}</span>
              <span className="text-xs font-mono text-success">A${activePhase.reward.toFixed(2)}</span>
            </div>
            {activePhase.instructions && (
              <div className="prose prose-sm max-w-none text-xs">
                <ReactMarkdown>{activePhase.instructions}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 2: Drip Feed Status */}
      {dripState && task.dripFeed?.enabled && (
        <div className={cn(
          "flex items-center gap-3 rounded-lg border p-3",
          dripState.state === "active" ? "border-success/20 bg-success/5" :
          dripState.state === "waiting" ? "border-warning/20 bg-warning/5" :
          "border-border/30 bg-muted/30"
        )}>
          <Timer className={cn(
            "h-4 w-4 shrink-0",
            dripState.state === "active" ? "text-success" :
            dripState.state === "waiting" ? "text-warning" :
            "text-muted-foreground"
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {dripState.state === "active" && `${dripState.availableSlots} slot${dripState.availableSlots !== 1 ? "s" : ""} available`}
              {dripState.state === "waiting" && "Waiting for next release"}
              {dripState.state === "completed" && "All slots released"}
            </p>
            {dripState.nextReleaseIn !== null && dripState.state !== "completed" && (
              <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                <span className="text-[10px]">Next release in</span>
                <DripFeedCountdown nextReleaseIn={dripState.nextReleaseIn} />
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{dripState.totalReleased} released</p>
          </div>
        </div>
      )}

      {/* Task instructions or active phase instructions */}
      {!isPhased && (
        <div className="prose prose-sm max-w-none rounded-lg border border-border/30 bg-muted/30 p-3">
          <ReactMarkdown>{task.details}</ReactMarkdown>
        </div>
      )}

      <TaskInstructionDetails task={task} />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/30 p-2.5 text-center">
          <DollarSign className="mx-auto h-4 w-4 text-success" />
          <p className="mt-0.5 text-base font-semibold">A${displayReward.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Reward</p>
        </div>
        <div className="rounded-lg border border-border/30 p-2.5 text-center">
          <Users className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-0.5 text-base font-semibold">
            {effectiveSpotsLeft}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDripLocked ? "Releasing soon" : "Spots Left"}
          </p>
        </div>
      </div>

      {/* Phase 2: Phase Progress Visualization (show past phases worker submitted to) */}
      {isPhased && task.phases && task.phases.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">All Phases</span>
          <div className="space-y-1.5">
            {task.phases.map((phase) => {
              const isActive = activePhase?.phaseIndex === phase.phaseIndex
              const isCompleted = phase.currentSubmissions >= phase.slots
              const hasSubmitted = submittedPhaseIndices.has(phase.phaseIndex)
              // PRD: Workers see past phases only if they submitted to them
              if (!isActive && !isCompleted && !hasSubmitted) return null
              // Also skip future incomplete phases worker hasn't submitted to
              if (!isActive && !hasSubmitted && phase.phaseIndex > (activePhase?.phaseIndex ?? 0)) return null
              return (
                <PhaseProgressCard
                  key={phase.phaseIndex}
                  phase={phase}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  hasSubmitted={hasSubmitted}
                />
              )
            })}
          </div>
        </div>
      )}

      {task.deadline && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Deadline: {task.deadline.toLocaleDateString()}
        </div>
      )}

      {isSubmitLocked && (
        <p className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
          You have already submitted this task. Additional submissions are disabled.
        </p>
      )}

      {isDripLocked && !isSubmitLocked && (
        <p className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
          No slots available right now. New slots will be released soon.
        </p>
      )}

      <Button className="w-full" size="sm" onClick={onSubmit} disabled={isSubmitLocked || isDripLocked}>
        <Send className="mr-2 h-4 w-4" />
        Submit Work
      </Button>
    </div>
  )
}
