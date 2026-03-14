import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { TASK_TYPE_META, type Task, type TaskType } from "@/lib/types"
import { Calendar, DollarSign, ExternalLink, Heart, Mail, Send, Share2, Users } from "lucide-react"

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

type TaskDetailProps = {
  task: Task
  isSubmitLocked: boolean
  onSubmit: () => void
}

export function TaskDetail({ task, isSubmitLocked, onSubmit }: TaskDetailProps) {
  const Icon = TASK_ICONS[task.type]

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

      <div
        className="prose prose-sm max-w-none rounded-lg border border-border/30 bg-muted/30 p-3"
        dangerouslySetInnerHTML={{ __html: task.details }}
      />

      <TaskInstructionDetails task={task} />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/30 p-2.5 text-center">
          <DollarSign className="mx-auto h-4 w-4 text-success" />
          <p className="mt-0.5 text-base font-semibold">${task.reward.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Reward</p>
        </div>
        <div className="rounded-lg border border-border/30 p-2.5 text-center">
          <Users className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-0.5 text-base font-semibold">
            {task.maxSubmissions - task.currentSubmissions}
          </p>
          <p className="text-xs text-muted-foreground">Spots Left</p>
        </div>
      </div>

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

      <Button className="w-full" size="sm" onClick={onSubmit} disabled={isSubmitLocked}>
        <Send className="mr-2 h-4 w-4" />
        Submit Work
      </Button>
    </div>
  )
}
