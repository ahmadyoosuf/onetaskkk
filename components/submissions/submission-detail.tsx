import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Submission, SubmissionStatus, Task } from "@/lib/types"
import { Calendar, Check, Clock, ExternalLink, FileText, Info, Mail, MessageSquare, Share2, ThumbsUp, User, X } from "lucide-react"
import { EvidenceImage } from "./evidence-image"

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

const TASK_TYPE_ICONS: Record<string, React.ReactNode> = {
  social_media_posting: <Share2 className="h-4 w-4" />,
  email_sending: <Mail className="h-4 w-4" />,
  social_media_liking: <ThumbsUp className="h-4 w-4" />,
}

const TASK_TYPE_LABELS: Record<string, string> = {
  social_media_posting: "Social Media Posting",
  email_sending: "Email Sending",
  social_media_liking: "Social Media Liking",
}

type SubmissionDetailProps = {
  submission: Submission
  task?: Task | null  // Full task object for ADHD UX - shows all context
  taskTitle?: string  // Fallback if task not provided
  onApprove: () => void
  onReject: () => void
  isReviewing: boolean
}

export function SubmissionDetail({
  submission,
  task,
  taskTitle,
  onApprove,
  onReject,
  isReviewing,
}: SubmissionDetailProps) {
  const displayTitle = task?.title || taskTitle

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Submission Details</h3>
          <Badge variant={submission.status}>
            {STATUS_LABELS[submission.status]}
          </Badge>
        </div>

        {/* Task Context Section - PRD ADHD UX Requirement */}
        {task && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Task Context</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-muted-foreground">
                  {TASK_TYPE_ICONS[task.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPE_LABELS[task.type]}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  A${task.reward.toFixed(2)}
                </div>
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Task-specific details for context */}
              <div className="mt-2 space-y-1 text-xs">
                {task.type === "social_media_posting" && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Platform:</span>
                      <span className="capitalize">{task.taskDetails.platform}</span>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <span className="font-medium text-muted-foreground">Required Post:</span>
                      <p className="mt-1 whitespace-pre-wrap">{task.taskDetails.postContent}</p>
                    </div>
                  </>
                )}
                {task.type === "email_sending" && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Target Email:</span>
                      <span>{task.taskDetails.targetEmail}</span>
                    </div>
                    <div className="rounded bg-muted/50 p-2">
                      <span className="font-medium text-muted-foreground">Required Content:</span>
                      <p className="mt-1 whitespace-pre-wrap">{task.taskDetails.emailContent}</p>
                    </div>
                  </>
                )}
                {task.type === "social_media_liking" && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Platform:</span>
                      <span className="capitalize">{task.taskDetails.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Post to Like:</span>
                      <a
                        href={task.taskDetails.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {task.taskDetails.postUrl}
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Full instructions always visible (PRD ADHD/Reduce Drag requirement) */}
              {task.details && (
                <div className="mt-2 rounded bg-muted/50 p-2 text-xs whitespace-pre-wrap">
                  {task.details}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback: just show title if no full task */}
        {!task && displayTitle && (
          <p className="truncate text-sm text-muted-foreground">{displayTitle}</p>
        )}

        <Separator />

        {/* Submitter Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{submission.userName}</p>
            <p className="text-xs text-muted-foreground">{submission.submittedAt.toLocaleString()}</p>
          </div>
        </div>

        {/* Submission Evidence */}
        {submission.postUrl && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Submitted Post URL
            </Label>
            <a
              href={submission.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline break-all rounded-lg border border-border/30 bg-background p-3"
            >
              {submission.postUrl}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        )}

        {submission.emailContent && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              Submitted Email Content
            </Label>
            <div className="rounded-lg border border-border/30 bg-background p-3 text-sm whitespace-pre-wrap">
              {submission.emailContent}
            </div>
          </div>
        )}

        {submission.screenshotUrl && (
          <EvidenceImage screenshotUrl={submission.screenshotUrl} />
        )}

        {submission.adminNotes && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Admin Notes
            </Label>
            <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-sm">{submission.adminNotes}</div>
          </div>
        )}

        {submission.reviewedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Reviewed {submission.reviewedAt.toLocaleString()}
          </div>
        )}

        {submission.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-success hover:bg-success/90"
              onClick={onApprove}
              disabled={isReviewing}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={onReject}
              disabled={isReviewing}
            >
              <X className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {isReviewing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 animate-spin" />
          Processing review…
        </div>
      )}
    </>
  )
}
