"use client"

import { useState, useMemo, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  FileText, MessageSquare, ChevronRight, Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTask, updateSubmissionStatus } from "@/lib/store"
import { useTasks, useSubmissions } from "@/hooks/use-store"
import type { Submission, SubmissionStatus } from "@/lib/types"

const STATUS_STYLES: Record<SubmissionStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", icon: Check },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
}

function SubmissionsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const taskIdFromUrl = searchParams.get("task")
  const parentRef = useRef<HTMLDivElement>(null)

  const submissions = useSubmissions()
  const tasks = useTasks()
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all")
  const [taskFilter, setTaskFilter] = useState<string>(taskIdFromUrl || "all")
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved")
  const [adminNotes, setAdminNotes] = useState("")
  const [groupByTask, setGroupByTask] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // Handle submission selection - show mobile sheet on small screens
  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmission(submission)
    if (window.innerWidth < 1024) {
      setShowMobileDetail(true)
    }
  }

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

  // Group submissions by task
  const groupedSubmissions = useMemo(() => {
    if (!groupByTask) return null
    const groups = new Map<string, { task: typeof tasks[0] | undefined; submissions: Submission[] }>()
    for (const sub of filteredSubmissions) {
      if (!groups.has(sub.taskId)) {
        groups.set(sub.taskId, { task: tasks.find((t) => t.id === sub.taskId), submissions: [] })
      }
      groups.get(sub.taskId)!.submissions.push(sub)
    }
    return Array.from(groups.values()).sort((a, b) => 
      (b.task?.createdAt.getTime() || 0) - (a.task?.createdAt.getTime() || 0)
    )
  }, [filteredSubmissions, tasks, groupByTask])

  // TanStack Virtual for performance with 100+ rows
  const virtualizer = useVirtualizer({
    count: filteredSubmissions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  const handleReview = (action: "approved" | "rejected") => {
    setReviewAction(action)
    setShowReviewDialog(true)
  }

  const confirmReview = () => {
    if (!selectedSubmission) return
    updateSubmissionStatus(selectedSubmission.id, reviewAction, adminNotes || undefined)
    toast({
      title: `Submission ${reviewAction}`,
      description: `${selectedSubmission.userName}'s submission has been ${reviewAction}.`,
    })
    setShowReviewDialog(false)
    setAdminNotes("")
    setSelectedSubmission(null)
  }

  // Running totals
  const pendingCount = submissions.filter((s) => s.status === "pending").length
  const approvedCount = submissions.filter((s) => s.status === "approved").length
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="text-sm text-muted-foreground">Review and manage worker submissions.</p>
        </div>

        {/* Running Totals */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm",
              statusFilter === "all" ? "bg-primary/10 text-primary border-primary/30" : "border-border/30"
            )}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm",
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
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm",
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
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm",
              statusFilter === "rejected" ? "bg-destructive/20 text-destructive border-destructive/50" : STATUS_STYLES.rejected.className
            )}
            onClick={() => setStatusFilter("rejected")}
          >
            <X className="mr-1 h-3 w-3" />
            Rejected ({rejectedCount})
          </Badge>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Virtualized Submissions List */}
          <div className="flex-1 space-y-3">
            {/* Task Filter & Group Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="w-full sm:w-64">
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
              <Button
                variant={groupByTask ? "secondary" : "outline"}
                size="sm"
                onClick={() => setGroupByTask(!groupByTask)}
                className="gap-1.5"
              >
                <Layers className="h-3.5 w-3.5" />
                Group by Task
              </Button>
            </div>

            {/* Virtualized List or Grouped View */}
            {groupByTask && groupedSubmissions ? (
              <div className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)] overflow-auto scrollbar-hide rounded-lg border border-border/30 p-2 space-y-4">
                {groupedSubmissions.map((group) => (
                  <div key={group.task?.id || "unknown"} className="space-y-2">
                    <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded-md">
                      <span className="font-medium text-sm truncate">{group.task?.title || "Unknown Task"}</span>
                      <Badge variant="outline" className="text-xs">{group.submissions.length}</Badge>
                    </div>
                    {group.submissions.map((submission) => {
                      const statusStyle = STATUS_STYLES[submission.status]
                      const StatusIcon = statusStyle.icon
                      const isSelected = selectedSubmission?.id === submission.id
                      return (
                        <div
                          key={submission.id}
                          onClick={() => handleSubmissionSelect(submission)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all ml-2",
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/20 hover:border-border/40 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", statusStyle.className)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{submission.userName}</p>
                              <p className="text-xs text-muted-foreground">{submission.submittedAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isSelected && "rotate-90")} />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
            <div
              ref={parentRef}
              className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)] overflow-auto scrollbar-hide rounded-lg border border-border/30"
            >
              {filteredSubmissions.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground">No submissions found.</p>
                </div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const submission = filteredSubmissions[virtualRow.index]
                    const task = getTask(submission.taskId)
                    const statusStyle = STATUS_STYLES[submission.status]
                    const StatusIcon = statusStyle.icon
                    const isSelected = selectedSubmission?.id === submission.id

                    return (
                      <div
                        key={submission.id}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="p-1"
                      >
                        <div
                          onClick={() => handleSubmissionSelect(submission)}
                          className={cn(
                            "flex h-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all touch-feedback",
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/20 hover:border-border/40 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              statusStyle.className
                            )}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{submission.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {task?.title || "Unknown Task"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:block text-xs text-muted-foreground">
                              {submission.submittedAt.toLocaleDateString()}
                            </span>
                            <ChevronRight className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isSelected && "rotate-90"
                            )} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredSubmissions.length} submissions{groupByTask && groupedSubmissions ? ` in ${groupedSubmissions.length} groups` : ""}
            </p>
          </div>

          {/* Detail Panel - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:w-80 xl:w-96">
            {selectedSubmission ? (
              <Card className="border-border/30 sticky top-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Submission Details</CardTitle>
                    <Badge variant="outline" className={STATUS_STYLES[selectedSubmission.status].className}>
                      {STATUS_STYLES[selectedSubmission.status].label}
                    </Badge>
                  </div>
                  <CardDescription className="truncate">
                    {getTask(selectedSubmission.taskId)?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{selectedSubmission.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSubmission.submittedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Proof */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Proof of Completion
                    </Label>
                    <div className="rounded-lg border border-border/30 bg-background p-3 text-sm">
                      {selectedSubmission.proof}
                    </div>
                  </div>

                  {/* Live App URL */}
                  {selectedSubmission.liveAppUrl && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Live URL</Label>
                      <a
                        href={selectedSubmission.liveAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                      >
                        {selectedSubmission.liveAppUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {selectedSubmission.adminNotes && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
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
                        size="sm"
                        className="flex-1 bg-success hover:bg-success/90" 
                        onClick={() => handleReview("approved")}
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReview("rejected")}
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/30 border-dashed">
                <CardContent className="flex h-48 lg:h-64 flex-col items-center justify-center text-center p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-medium text-sm">No submission selected</p>
                  <p className="text-xs text-muted-foreground">
                    Click on a submission to review
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      <Dialog open={showMobileDetail && !!selectedSubmission} onOpenChange={(open) => {
        setShowMobileDetail(open)
        if (!open) setSelectedSubmission(null)
      }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="text-base">Submission Details</DialogTitle>
                  <Badge variant="outline" className={STATUS_STYLES[selectedSubmission.status].className}>
                    {STATUS_STYLES[selectedSubmission.status].label}
                  </Badge>
                </div>
                <DialogDescription className="truncate">
                  {getTask(selectedSubmission.taskId)?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Submitter Info */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{selectedSubmission.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSubmission.submittedAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Proof */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Proof of Completion
                  </Label>
                  <div className="rounded-lg border border-border/30 bg-background p-3 text-sm">
                    {selectedSubmission.proof}
                  </div>
                </div>

                {/* Live URL */}
                {selectedSubmission.liveAppUrl && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Live URL</Label>
                    <a
                      href={selectedSubmission.liveAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                    >
                      {selectedSubmission.liveAppUrl}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedSubmission.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 h-11 bg-success hover:bg-success/90" 
                      onClick={() => handleReview("approved")}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1 h-11"
                      onClick={() => handleReview("rejected")}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
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
              <Label htmlFor="adminNotes" className="text-sm">
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
          <DialogFooter className="gap-2 sm:gap-0">
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
                  <Check className="mr-1.5 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <X className="mr-1.5 h-4 w-4" />
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
