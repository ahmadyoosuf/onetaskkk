"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Check, X, Clock, Filter, ExternalLink, User, Calendar, 
  FileText, MessageSquare, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSubmissions, getTasks, getTask, updateSubmissionStatus } from "@/lib/store"
import type { Submission, SubmissionStatus } from "@/lib/types"

const STATUS_STYLES: Record<SubmissionStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", icon: Check },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
}

function SubmissionsContent() {
  const searchParams = useSearchParams()
  const taskIdFromUrl = searchParams.get("task")

  const [submissions, setSubmissions] = useState(() => getSubmissions())
  const tasks = getTasks()
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all")
  const [taskFilter, setTaskFilter] = useState<string>(taskIdFromUrl || "all")
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved")
  const [adminNotes, setAdminNotes] = useState("")

  const filteredSubmissions = useMemo(() => {
    let result = submissions
    
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }
    
    if (taskFilter !== "all") {
      result = result.filter((s) => s.taskId === taskFilter)
    }
    
    return result
  }, [submissions, statusFilter, taskFilter])

  const handleReview = (action: "approved" | "rejected") => {
    setReviewAction(action)
    setShowReviewDialog(true)
  }

  const confirmReview = () => {
    if (!selectedSubmission) return
    
    updateSubmissionStatus(selectedSubmission.id, reviewAction, adminNotes || undefined)
    setSubmissions(getSubmissions())
    setShowReviewDialog(false)
    setAdminNotes("")
    setSelectedSubmission(null)
  }

  // Stats
  const pendingCount = submissions.filter((s) => s.status === "pending").length
  const approvedCount = submissions.filter((s) => s.status === "approved").length
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">Review and manage worker submissions.</p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1",
              statusFilter === "all" ? "bg-primary/10 text-primary border-primary/30" : "border-border/30"
            )}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1",
              statusFilter === "pending" ? "bg-warning/20 text-warning border-warning/50" : STATUS_STYLES.pending.className
            )}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending ({pendingCount})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1",
              statusFilter === "approved" ? "bg-success/20 text-success border-success/50" : STATUS_STYLES.approved.className
            )}
            onClick={() => setStatusFilter("approved")}
          >
            <Check className="mr-1 h-3 w-3" />
            Approved ({approvedCount})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1",
              statusFilter === "rejected" ? "bg-destructive/20 text-destructive border-destructive/50" : STATUS_STYLES.rejected.className
            )}
            onClick={() => setStatusFilter("rejected")}
          >
            <X className="mr-1 h-3 w-3" />
            Rejected ({rejectedCount})
          </Badge>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Submissions List */}
          <div className="flex-1 space-y-4">
            {/* Task Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scrollable List */}
            <ScrollArea className="h-[calc(100vh-340px)]">
              <div className="space-y-2 pr-4">
                {filteredSubmissions.length === 0 ? (
                  <Card className="border-border/30 border-dashed">
                    <CardContent className="flex h-32 items-center justify-center">
                      <p className="text-muted-foreground">No submissions found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSubmissions.map((submission, index) => {
                    const task = getTask(submission.taskId)
                    const statusStyle = STATUS_STYLES[submission.status]
                    const StatusIcon = statusStyle.icon
                    const isSelected = selectedSubmission?.id === submission.id
                    
                    return (
                      <Card
                        key={submission.id}
                        onClick={() => setSelectedSubmission(submission)}
                        className={cn(
                          "cursor-pointer border-border/30 transition-all animate-fade-in-up",
                          isSelected ? "border-primary/50 bg-primary/5" : "hover:border-border/60"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                statusStyle.className
                              )}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{submission.userName}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {task?.title || "Unknown Task"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {submission.submittedAt.toLocaleDateString()}
                              </span>
                              <ChevronRight className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isSelected && "rotate-90"
                              )} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detail Panel */}
          <div className="w-full lg:w-96">
            {selectedSubmission ? (
              <Card className="sticky top-24 border-border/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Submission Details</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={STATUS_STYLES[selectedSubmission.status].className}
                    >
                      {STATUS_STYLES[selectedSubmission.status].label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {getTask(selectedSubmission.taskId)?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedSubmission.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {selectedSubmission.submittedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Proof */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Proof of Completion
                    </Label>
                    <div className="rounded-lg border border-border/30 bg-background p-3 text-sm">
                      {selectedSubmission.proof}
                    </div>
                  </div>

                  {/* Live App URL */}
                  {selectedSubmission.liveAppUrl && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Live App URL</Label>
                      <a
                        href={selectedSubmission.liveAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {selectedSubmission.liveAppUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Admin Notes (if reviewed) */}
                  {selectedSubmission.adminNotes && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        Admin Notes
                      </Label>
                      <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-sm">
                        {selectedSubmission.adminNotes}
                      </div>
                    </div>
                  )}

                  {/* Review Date */}
                  {selectedSubmission.reviewedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Reviewed {selectedSubmission.reviewedAt.toLocaleString()}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedSubmission.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1 bg-success hover:bg-success/90" 
                        onClick={() => handleReview("approved")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReview("rejected")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/30 border-dashed">
                <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-medium">No submission selected</p>
                  <p className="text-sm text-muted-foreground">
                    Click on a submission to review
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Approve" : "Reject"} Submission
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approved" 
                ? "This will approve the submission and mark it as completed."
                : "This will reject the submission. Please provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">
                Admin Notes {reviewAction === "rejected" && "(recommended)"}
              </Label>
              <Textarea
                id="adminNotes"
                placeholder={reviewAction === "rejected" 
                  ? "Explain why this submission was rejected..."
                  : "Add any notes (optional)..."}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReview}
              className={reviewAction === "approved" ? "bg-success hover:bg-success/90" : ""}
              variant={reviewAction === "rejected" ? "destructive" : "default"}
            >
              {reviewAction === "approved" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading submissions...</div>
        </div>
      </AppShell>
    }>
      <SubmissionsContent />
    </Suspense>
  )
}
