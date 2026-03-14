import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Submission, SubmissionStatus } from "@/lib/types"
import { Calendar, Check, Clock, ExternalLink, FileText, ImageIcon, MessageSquare, User, X } from "lucide-react"

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

type SubmissionDetailProps = {
  submission: Submission
  taskTitle?: string
  onApprove: () => void
  onReject: () => void
  isReviewing: boolean
}

export function SubmissionDetail({
  submission,
  taskTitle,
  onApprove,
  onReject,
  isReviewing,
}: SubmissionDetailProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Submission Details</h3>
          <Badge variant={submission.status}>
            {STATUS_LABELS[submission.status]}
          </Badge>
        </div>
        {taskTitle && <p className="truncate text-sm text-muted-foreground">{taskTitle}</p>}

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{submission.userName}</p>
            <p className="text-xs text-muted-foreground">{submission.submittedAt.toLocaleString()}</p>
          </div>
        </div>

        {submission.postUrl && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Post URL
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
              Email Content
            </Label>
            <div className="rounded-lg border border-border/30 bg-background p-3 text-sm whitespace-pre-wrap">
              {submission.emailContent}
            </div>
          </div>
        )}

        {submission.screenshotUrl && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              Evidence Screenshot
            </Label>
            <a
              href={submission.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
            >
              {submission.screenshotUrl}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
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
