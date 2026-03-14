"use client"

import { useState, useMemo, useRef, Suspense } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useQueryState, parseAsStringLiteral, parseAsBoolean, parseAsString } from "nuqs"
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
  Clock, Check, X, FileText, ExternalLink, Eye, ChevronDown,
  MessageSquare, ImageIcon, Filter, Layers, ChevronRight, User, Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTask } from "@/lib/store"
import { useTasks, useSubmissions, useUpdateSubmissionStatus } from "@/hooks/use-store"
import type { Submission, SubmissionStatus } from "@/lib/types"

const STATUS_STYLES: Record<SubmissionStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", icon: Check },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
}

type SubmissionListRow =
  | {
      kind: "group"
      taskId: string
      taskTitle: string
      count: number
    }
  | {
      kind: "submission"
      submission: Submission
      taskTitle: string
    }

// URL state parsers for nuqs
const statusFilterParser = parseAsStringLiteral(["all", "pending", "approved", "rejected"] as const).withDefault("all")

function SubmissionsContent() {
  const { toast } = useToast()
  const { submissions, isLoading: isLoadingSubmissions, error } = useSubmissions()
  const { tasks, isLoading: isLoadingTasks } = useTasks()
  const updateSubmissionStatusMutation = useUpdateSubmissionStatus()
  const isDataLoading = isLoadingSubmissions || isLoadingTasks
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  
  // URL state management with nuqs
  const [statusFilter, setStatusFilter] = useQueryState("status", statusFilterParser)
  const [taskFilter, setTaskFilter] = useQueryState("task", parseAsString.withDefault("all"))
  const [groupByTask, setGroupByTask] = useQueryState("group", parseAsBoolean.withDefault(false))
  
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved")
  const [adminNotes, setAdminNotes] = useState("")
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

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

  const listRows = useMemo<SubmissionListRow[]>(() => {
    if (!groupByTask) {
      return filteredSubmissions.map((submission) => ({
        kind: "submission",
        submission,
        taskTitle: taskMap.get(submission.taskId)?.title || "Unknown Task",
      }))
    }

    const groups = new Map<string, Submission[]>()
    for (const submission of filteredSubmissions) {
      const group = groups.get(submission.taskId)
      if (group) {
        group.push(submission)
      } else {
        groups.set(submission.taskId, [submission])
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => (taskMap.get(b[0])?.createdAt.getTime() || 0) - (taskMap.get(a[0])?.createdAt.getTime() || 0))
      .flatMap(([taskId, group]) => [
        {
          kind: "group" as const,
          taskId,
          taskTitle: taskMap.get(taskId)?.title || "Unknown Task",
          count: group.length,
        },
        ...group.map((submission) => ({
          kind: "submission" as const,
          submission,
          taskTitle: taskMap.get(submission.taskId)?.title || "Unknown Task",
        })),
      ])
  }, [filteredSubmissions, groupByTask, taskMap])

  const groupCount = useMemo(
    () => listRows.reduce((count, row) => count + (row.kind === "group" ? 1 : 0), 0),
    [listRows]
  )

  const virtualizer = useVirtualizer({
    count: listRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => listRows[index]?.kind === "group" ? 44 : 72,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 12,
  })

  const handleReview = (action: "approved" | "rejected") => {
    setReviewAction(action)
    setShowReviewDialog(true)
  }

  const confirmReview = async () => {
    if (!selectedSubmission) return
    try {
      await updateSubmissionStatusMutation.mutateAsync({
        id: selectedSubmission.id,
        status: reviewAction,
        adminNotes: adminNotes || undefined,
      })
      toast({
        title: `Submission ${reviewAction}`,
        description: `${selectedSubmission.userName}'s submission has been ${reviewAction}.`,
      })
      setShowReviewDialog(false)
      setAdminNotes("")
      setSelectedSubmission(null)
      setShowMobileDetail(false)
    } catch {
      toast({
        title: "Review failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const isReviewing = updateSubmissionStatusMutation.isPending

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

        {/* Status Funnel Visualization */}
        <Card className="border-border/30">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              {/* Funnel bars */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Submission Pipeline</span>
                  <span>{submissions.length} total</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  {submissions.length > 0 && (
                    <>
                      <div 
                        className="bg-warning transition-all duration-500" 
                        style={{ width: `${(pendingCount / submissions.length) * 100}%` }}
                      />
                      <div 
                        className="bg-success transition-all duration-500" 
                        style={{ width: `${(approvedCount / submissions.length) * 100}%` }}
                      />
                      <div 
                        className="bg-destructive transition-all duration-500" 
                        style={{ width: `${(rejectedCount / submissions.length) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">{pendingCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">Approved</span>
                    <span className="font-medium">{approvedCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Rejected</span>
                    <span className="font-medium">{rejectedCount}</span>
                  </div>
                </div>
              </div>
              
              {/* Approval rate metric */}
              <div className="shrink-0 rounded-lg border border-border/30 bg-muted/30 px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-success">
                  {submissions.length > 0 ? Math.round((approvedCount / submissions.length) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm transition-all",
              statusFilter === "all" ? "bg-primary/10 text-primary border-primary/30" : "border-border/30 hover:border-border"
            )}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm transition-all",
              statusFilter === "pending" ? "bg-warning/20 text-warning border-warning/50" : STATUS_STYLES.pending.className + " hover:bg-warning/5"
            )}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending ({pendingCount})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm transition-all",
              statusFilter === "approved" ? "bg-success/20 text-success border-success/50" : STATUS_STYLES.approved.className + " hover:bg-success/5"
            )}
            onClick={() => setStatusFilter("approved")}
          >
            <Check className="mr-1 h-3 w-3" />
            Approved ({approvedCount})
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs sm:text-sm transition-all",
              statusFilter === "rejected" ? "bg-destructive/20 text-destructive border-destructive/50" : STATUS_STYLES.rejected.className + " hover:bg-destructive/5"
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

            <div
              ref={parentRef}
              className="overflow-auto scrollbar-hide rounded-lg border border-border/30"
              style={{ height: "calc(100svh - 300px)" }}
            >
              {isDataLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground animate-pulse">Loading submissions...</p>
                </div>
              ) : listRows.length === 0 ? (
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
                    const row = listRows[virtualRow.index]
                    if (!row) return null

                    return (
                      <div
                        key={row.kind === "group" ? `group-${row.taskId}` : row.submission.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                          padding: row.kind === "group" ? "8px 8px 2px" : groupByTask ? "2px 8px 2px 20px" : "2px 4px",
                        }}
                      >
                        {row.kind === "group" ? (
                          <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
                            <span className="truncate text-sm font-medium">{row.taskTitle}</span>
                            <Badge variant="outline" className="text-xs">{row.count}</Badge>
                          </div>
                        ) : (() => {
                          const statusStyle = STATUS_STYLES[row.submission.status]
                          const StatusIcon = statusStyle.icon
                          const isSelected = selectedSubmission?.id === row.submission.id

                          return (
                            <div
                              onClick={() => handleSubmissionSelect(row.submission)}
                              className={cn(
                                "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all touch-feedback",
                                isSelected
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-border/20 hover:border-border/40 hover:bg-muted/30"
                              )}
                            >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {/* Avatar with initials */}
                                                <div className="relative shrink-0">
                                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {row.submission.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                  </div>
                                                  {/* Status indicator dot */}
                                                  <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center",
                                                    row.submission.status === "pending" ? "bg-warning" : 
                                                    row.submission.status === "approved" ? "bg-success" : "bg-destructive"
                                                  )}>
                                                    <StatusIcon className="h-2 w-2 text-white" />
                                                  </div>
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="truncate text-sm font-medium">{row.submission.userName}</p>
                                                  <p className="truncate text-xs text-muted-foreground">
                                                    {groupByTask ? row.submission.submittedAt.toLocaleDateString() : row.taskTitle}
                                                  </p>
                                                </div>
                                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {!groupByTask && (
                                  <span className="hidden text-xs text-muted-foreground sm:block">
                                    {row.submission.submittedAt.toLocaleDateString()}
                                  </span>
                                )}
                                <ChevronRight className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  isSelected && "rotate-90"
                                )} />
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredSubmissions.length} submissions{groupByTask ? ` in ${groupCount} groups` : ""}
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

                  {/* Task-type-specific submission fields per PRD */}
                  {selectedSubmission.postUrl && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        Post URL
                      </Label>
                      <a
                        href={selectedSubmission.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline break-all rounded-lg border border-border/30 bg-background p-3"
                      >
                        {selectedSubmission.postUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  
                  {selectedSubmission.emailContent && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Email Content
                      </Label>
                      <div className="rounded-lg border border-border/30 bg-background p-3 text-sm whitespace-pre-wrap">
                        {selectedSubmission.emailContent}
                      </div>
                    </div>
                  )}

                  {/* Evidence Screenshot */}
                  {selectedSubmission.screenshotUrl && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        Evidence Screenshot
                      </Label>
                      <a
                        href={selectedSubmission.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                      >
                        {selectedSubmission.screenshotUrl}
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

                {/* Task-type-specific submission fields per PRD */}
                {selectedSubmission.postUrl && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      Post URL
                    </Label>
                    <a
                      href={selectedSubmission.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline break-all rounded-lg border border-border/30 bg-background p-3"
                    >
                      {selectedSubmission.postUrl}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}
                
                {selectedSubmission.emailContent && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Email Content
                    </Label>
                    <div className="rounded-lg border border-border/30 bg-background p-3 text-sm whitespace-pre-wrap">
                      {selectedSubmission.emailContent}
                    </div>
                  </div>
                )}

                {/* Evidence Screenshot */}
                {selectedSubmission.screenshotUrl && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      Evidence Screenshot
                    </Label>
                    <a
                      href={selectedSubmission.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                    >
                      {selectedSubmission.screenshotUrl}
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
              disabled={isReviewing}
              className={reviewAction === "approved" ? "bg-success hover:bg-success/90" : ""}
              variant={reviewAction === "rejected" ? "destructive" : "default"}
            >
              {isReviewing ? (
                "Processing..."
              ) : reviewAction === "approved" ? (
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
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading submissions...</div>
        </div>
      </AppShell>
    }>
      <SubmissionsContent />
    </Suspense>
  )
}
